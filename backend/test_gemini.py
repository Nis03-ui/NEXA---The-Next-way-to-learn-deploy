import asyncio

from app.services.gemini import GeminiClient


async def main():
    result = await GeminiClient().generate(
        "Reply with exactly: GEMINI_OK"
    )
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
