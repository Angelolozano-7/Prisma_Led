import gspread
from google.oauth2.service_account import Credentials
from flask import current_app
from app.services.retry_utils import retry_on_rate_limit


@retry_on_rate_limit(max_retries=4)
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


from app.services.retry_utils import retry_on_rate_limit
from app.services.sheets_client import connect_sheet

@retry_on_rate_limit()
def get_tarifas():
    sheet = connect_sheet()
    ws = sheet.worksheet("tarifas")
    return ws.get_all_records()
