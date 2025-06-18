import gspread
from google.oauth2.service_account import Credentials

def connect_sheet():
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]  # 👈 Incluye también el scope de Google Drive

    credentials = Credentials.from_service_account_file(
        "credentials.json", scopes=scopes
    )
    client = gspread.authorize(credentials)

    # Usa el ID directamente para evitar problemas de permisos al buscar por nombre
    spreadsheet_id = "16KbxwXdWxMleKsGK57z0OXQjBDtZ2wDgDNX9nuMxUJI"  # ⬅️ Reemplaza por tu ID real
    spreadsheet = client.open_by_key(spreadsheet_id)

    return spreadsheet
