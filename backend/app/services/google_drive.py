import io
from functools import lru_cache

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

from app.core.config import settings


SCOPES = ["https://www.googleapis.com/auth/drive"]


@lru_cache(maxsize=1)
def _drive_service():
    if not settings.google_drive_folder_id:
        raise RuntimeError("GOOGLE_DRIVE_FOLDER_ID is not configured")
    if not settings.google_drive_client_id or not settings.google_drive_client_secret:
        raise RuntimeError("Google Drive OAuth credentials are not configured")
    if not settings.google_drive_refresh_token:
        raise RuntimeError("GOOGLE_DRIVE_REFRESH_TOKEN is not configured")

    credentials = Credentials(
        token=None,
        refresh_token=settings.google_drive_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_drive_client_id,
        client_secret=settings.google_drive_client_secret,
        scopes=SCOPES,
    )
    credentials.refresh(Request())
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def _media_type(filename: str, content_type: str | None) -> str:
    return content_type or "application/octet-stream"


def upload_file(content: bytes, filename: str, content_type: str | None = None) -> str:
    service = _drive_service()
    metadata = {"name": filename, "parents": [settings.google_drive_folder_id]}
    media = MediaIoBaseUpload(io.BytesIO(content), mimetype=_media_type(filename, content_type), resumable=False)
    result = service.files().create(
        body=metadata, media_body=media, fields="id", supportsAllDrives=True
    ).execute()
    return result["id"]


def download_file(file_id: str) -> tuple[bytes, str]:
    service = _drive_service()
    metadata = service.files().get(fileId=file_id, fields="name,mimeType", supportsAllDrives=True).execute()
    request = service.files().get_media(fileId=file_id, supportsAllDrives=True)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buffer.getvalue(), metadata.get("mimeType", "application/octet-stream")


def delete_file(file_id: str) -> None:
    _drive_service().files().delete(fileId=file_id, supportsAllDrives=True).execute()
