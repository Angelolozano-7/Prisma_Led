import gspread
from google.oauth2.service_account import Credentials
from flask import current_app

def connect_sheet():
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]

    credentials_path = current_app.config["GOOGLE_CREDENTIALS_PATH"]
    spreadsheet_id = current_app.config["SPREADSHEET_ID"]

    credentials = Credentials.from_service_account_file(credentials_path, scopes=scopes)
    client = gspread.authorize(credentials)
    spreadsheet = client.open_by_key(spreadsheet_id)

    return spreadsheet
