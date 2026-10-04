import httpx

from app.core.config import settings


def send_email(to_email: str, subject: str, html_content: str) -> None:
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is not configured")
    if not settings.resend_from_email:
        raise RuntimeError("RESEND_FROM_EMAIL is not configured")

    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        },
        timeout=30.0,
    )
    response.raise_for_status()
