import asyncio
import httpx

from app.core.config import settings


class GeminiError(Exception):
    """Raised when communication with Gemini fails."""


class GeminiClient:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.fallback_model = settings.gemini_fallback_model

    async def _generate_with_model(
        self,
        model: str,
        prompt: str,
        system_instruction: str | None = None,
    ) -> str:
        original = self.model
        self.model = model
        try:
            return await self.generate(prompt, system_instruction)
        finally:
            self.model = original
    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
    ) -> str:
        if not self.api_key:
            raise GeminiError("Gemini API key is not configured.")

        if not self.model:
            raise GeminiError("Gemini model is not configured.")

        url = (
            "https://generativelanguage.googleapis.com"
            f"/v1beta/models/{self.model}:generateContent"
        )

        payload = {
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        last_status: int | None = None

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                for attempt in range(3):
                    try:
                        response = await client.post(
                            url,
                            headers={
                                "x-goog-api-key": self.api_key,
                                "Content-Type": "application/json",
                            },
                            json=payload,
                        )
                        last_status = response.status_code

                        if response.status_code in {429, 500, 502, 503, 504} and attempt < 2:
                            await asyncio.sleep(2 ** attempt)
                            continue

                        response.raise_for_status()
                        break

                    except httpx.RequestError:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2 ** attempt)

        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            body = exc.response.text[:1200]
            print(f"GEMINI ERROR {status_code}: {body}", flush=True)

            if status_code == 401 or status_code == 403:
                raise GeminiError("Gemini authentication failed. Check the Render GEMINI_API_KEY.") from exc
            if status_code == 404:
                raise GeminiError(f"Gemini model '{self.model}' was not found.") from exc
            if status_code == 429 and self.fallback_model and self.fallback_model != self.model:
                print(f"GEMINI FALLBACK: switching to {self.fallback_model}", flush=True)
                return await self._generate_with_model(self.fallback_model, prompt, system_instruction)
            if status_code == 429:
                raise GeminiError("Gemini rate limit or quota reached. Check the Google AI project quota/billing.") from exc

            raise GeminiError(f"Gemini API returned HTTP {status_code}.") from exc

        except httpx.RequestError as exc:
            raise GeminiError("Gemini API request failed.") from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise GeminiError("Gemini returned invalid JSON.") from exc

        try:
            candidates = data["candidates"]
            if not candidates:
                raise GeminiError("Gemini returned no candidates.")

            parts = candidates[0]["content"]["parts"]
            if not parts:
                raise GeminiError("Gemini returned no response parts.")

            text = parts[0]["text"]
            if not text or not text.strip():
                raise GeminiError("Gemini returned an empty response.")

            return text.strip()
        except GeminiError:
            raise
        except (KeyError, IndexError, TypeError) as exc:
            raise GeminiError("Gemini returned an unexpected response.") from exc
