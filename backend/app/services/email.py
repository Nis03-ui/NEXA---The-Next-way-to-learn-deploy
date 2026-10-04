import httpx

from app.core.config import settings


async def send_email(to_email: str, subject: str, html_content: str) -> None:
    """Send transactional email through Resend with actionable provider errors."""
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is not configured")
    if not settings.resend_from_email:
        raise RuntimeError("RESEND_FROM_EMAIL is not configured")

    payload = {
        "from": settings.resend_from_email,
        "to": [to_email],
        "subject": subject,
        "html": html_content,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if response.is_error:
        try:
            provider_error = response.json()
        except ValueError:
            provider_error = response.text
        raise RuntimeError(
            f"Resend rejected the email ({response.status_code}): {provider_error}"
        )
