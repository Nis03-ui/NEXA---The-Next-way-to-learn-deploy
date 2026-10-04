"""One-time local helper to authorize NEXA to use your own Google Drive.

Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET from the Desktop OAuth
client, then run this script. Keep the printed refresh token private.
"""
import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/drive"]

client_id = os.environ.get("GOOGLE_DRIVE_CLIENT_ID")
client_secret = os.environ.get("GOOGLE_DRIVE_CLIENT_SECRET")
if not client_id or not client_secret:
    raise SystemExit("Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET first.")

config = {
    "installed": {
        "client_id": client_id,
        "client_secret": client_secret,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"],
    }
}
flow = InstalledAppFlow.from_client_config(config, SCOPES)
credentials = flow.run_local_server(port=0, access_type="offline", prompt="consent")
print("\\nGOOGLE_DRIVE_REFRESH_TOKEN=")
print(credentials.refresh_token)
