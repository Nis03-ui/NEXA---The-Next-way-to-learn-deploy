import io
import json
from functools import lru_cache

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload

from app.core.config import settings


SCOPES = ["https://www.googleapis.com/auth/drive"]


@lru_cache(maxsize=1)
def _drive_service():
    if not settings.google_drive_service_account_json:
        raise RuntimeError("Google Drive is not configured")
    if not settings.google_drive_folder_id:
        raise RuntimeError("GOOGLE_DRIVE_FOLDER_ID is not configured")

    try:
        credentials_info = json.loads(settings.google_drive_service_account_json)
    except json.JSONDecodeError as exc:
        raise RuntimeError("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not valid JSON") from exc
    if not isinstance(credentials_info, dict) or credentials_info.get("type") != "service_account":
        raise RuntimeError("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON must contain a service-account credential")
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info,
        scopes=SCOPES,
    )
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def _media_type(filename: str, content_type: str | None) -> str:
    return content_type or "application/octet-stream"


def upload_file(
    content: bytes,
    filename: str,
    content_type: str | None = None,
) -> str:
    service = _drive_service()
    metadata = {
        "name": filename,
        "parents": [settings.google_drive_folder_id],
    }
    media = MediaIoBaseUpload(
        io.BytesIO(content),
        mimetype=_media_type(filename, content_type),
        resumable=False,
    )
    result = service.files().create(
        body=metadata,
        media_body=media,
        fields="id",
        supportsAllDrives=True,
    ).execute()
    return result["id"]


def download_file(file_id: str) -> tuple[bytes, str]:
    service = _drive_service()
    metadata = service.files().get(
        fileId=file_id,
        fields="name,mimeType",
        supportsAllDrives=True,
    ).execute()

    request = service.files().get_media(
        fileId=file_id,
        supportsAllDrives=True,
    )
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)

    done = False
    while not done:
        _, done = downloader.next_chunk()

    return buffer.getvalue(), metadata.get("mimeType", "application/octet-stream")


def delete_file(file_id: str) -> None:
    service = _drive_service()
    service.files().delete(
        fileId=file_id,
        supportsAllDrives=True,
    ).execute()
