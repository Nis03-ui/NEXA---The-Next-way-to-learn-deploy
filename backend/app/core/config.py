from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "NEXA API"
    environment: str = "development"

    database_url: str = "sqlite+aiosqlite:///./nexa.db"

    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"

    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    password_reset_expire_minutes: int = 30
    email_verification_expire_minutes: int = 30

    frontend_origin: str = "http://localhost:3000"

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str = "NEXA"

    resend_api_key: str | None = None
    resend_from_email: str | None = None

    upload_dir: str = "uploads"

    google_drive_client_id: str | None = None
    google_drive_client_secret: str | None = None
    google_drive_refresh_token: str | None = None
    google_drive_folder_id: str | None = None

    gemini_api_key: str | None = None
    gemini_api_key_backup: str | None = None
    gemini_api_key_backup_2: str | None = None
    gemini_model: str = "gemini-3.8-flash"
    gemini_fallback_model: str = "gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
