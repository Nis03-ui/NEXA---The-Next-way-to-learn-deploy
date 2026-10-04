import asyncio
import httpx

from app.core.config import settings


class GeminiError(Exception):
    """Raised when communication with Gemini fails."""


class GeminiClient:
    def __init__(self):
        self.api_keys = [
            key
            for key in (
                settings.gemini_api_key,
                settings.gemini_api_key_backup,
                settings.gemini_api_key_backup_2,
            )
            if key
        ]
        self.models = [
            model
            for model in (
                settings.gemini_model,
                settings.gemini_fallback_model,
            )
            if model
        ]

    async def _request(self, api_key: str, model: str, prompt: str, system_instruction: str | None) -> str:
        url = (
            "https://generativelanguage.googleapis.com"
            f"/v1beta/models/{model}:generateContent"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                url,
                headers={
                    "x-goog-api-key": api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code >= 400:
            body = response.text[:1200]
            print(f"GEMINI ERROR {response.status_code}: {body}", flush=True)
            raise httpx.HTTPStatusError(
                f"Gemini returned HTTP {response.status_code}",
                request=response.request,
                response=response,
            )

        try:
            data = response.json()
            parts = data["candidates"][0]["content"]["parts"]
            text = parts[0]["text"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise GeminiError("Gemini returned an unexpected response.") from exc

        if not text or not text.strip():
            raise GeminiError("Gemini returned an empty response.")
        return text.strip()

    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
    ) -> str:
        if not self.api_keys:
            raise GeminiError("Gemini API key is not configured.")
        if not self.models:
            raise GeminiError("Gemini model is not configured.")

        last_error: Exception | None = None

        # Try every configured key/model combination. This makes the
        # configured backup keys useful instead of only retrying one key.
        for key_index, api_key in enumerate(self.api_keys):
            for model_index, model in enumerate(self.models):
                for attempt in range(2):
                    try:
                        return await self._request(
                            api_key, model, prompt, system_instruction
                        )
                    except httpx.HTTPStatusError as exc:
                        last_error = exc
                        status = exc.response.status_code

                        # Authentication errors mean this key is unusable;
                        # immediately move to the next configured key.
                        if status in {401, 403}:
                            break

                        # Invalid model: try the next configured model.
                        if status == 404:
                            break

                        # Temporary overload/quota: retry briefly, then
                        # move to the next model/key.
                        if status in {429, 500, 502, 503, 504}:
                            if attempt == 0:
                                await asyncio.sleep(1)
                                continue
                            break

                        break
                    except (httpx.RequestError, GeminiError) as exc:
                        last_error = exc
                        if attempt == 0:
                            await asyncio.sleep(1)
                            continue
                        break

        if isinstance(last_error, httpx.HTTPStatusError):
            status = last_error.response.status_code
            if status in {401, 403}:
                raise GeminiError("All configured Gemini API keys were rejected.") from last_error
            if status == 404:
                raise GeminiError("Configured Gemini models were not found.") from last_error
            if status == 429:
                raise GeminiError("All configured Gemini keys/models reached quota or rate limits.") from last_error
            if status in {500, 502, 503, 504}:
                raise GeminiError("Gemini is temporarily unavailable on all configured keys/models.") from last_error

        raise GeminiError("Gemini API request failed on all configured backups.") from last_error
