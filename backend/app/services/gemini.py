import asyncio

import httpx

from app.core.config import settings


class GeminiError(Exception):
    """Raised when communication with Gemini fails."""


class GeminiClient:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = "gemini-3.6-flash"

    async def generate(
        self,
        prompt: str,
        system_instruction: str | None = None,
    ) -> str:
        if not self.api_key:
            raise GeminiError("Gemini API key is not configured.")

        url = (
            "https://generativelanguage.googleapis.com"
            f"/v1beta/models/{self.model}:generateContent"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt,
                        }
                    ]
                }
            ]
        }

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [
                    {
                        "text": system_instruction,
                    }
                ]
            }

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

                        if response.status_code in {429, 500, 502, 503, 504}:
                            if attempt < 2:
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
            response_body = exc.response.text[:1000]

            print(
                f"GEMINI ERROR {status_code}: {response_body}",
                flush=True,
            )

            raise GeminiError(
                f"Gemini API returned HTTP {status_code}."
            ) from exc

        except httpx.RequestError as exc:
            raise GeminiError(
                "Gemini API request failed."
            ) from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise GeminiError(
                "Gemini returned invalid JSON."
            ) from exc

        try:
            candidates = data["candidates"]

            if not candidates:
                raise GeminiError(
                    "Gemini returned no candidates."
                )

            content = candidates[0]["content"]
            parts = content["parts"]

            if not parts:
                raise GeminiError(
                    "Gemini returned no response parts."
                )

            text = parts[0]["text"]

            if not text or not text.strip():
                raise GeminiError(
                    "Gemini returned an empty response."
                )

            return text.strip()

        except GeminiError:
            raise

        except (KeyError, IndexError, TypeError) as exc:
            raise GeminiError(
                "Gemini returned an unexpected response."
            ) from exc