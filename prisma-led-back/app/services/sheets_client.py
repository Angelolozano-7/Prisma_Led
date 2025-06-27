import gspread
from google.oauth2.service_account import Credentials
from flask import current_app
from app.services.retry_utils import retry_on_rate_limit


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


@retry_on_rate_limit()
def get_tarifas():
    sheet = connect_sheet()
    return sheet.worksheet("tarifas").get_all_records()


@retry_on_rate_limit()
def get_pantallas():
    sheet = connect_sheet()
    return sheet.worksheet("pantallas").get_all_records()


@retry_on_rate_limit()
def get_reservas():
    sheet = connect_sheet()
    return sheet.worksheet("reservas").get_all_records()


@retry_on_rate_limit()
def get_prereservas():
    sheet = connect_sheet()
    return sheet.worksheet("prereservas").get_all_records()


@retry_on_rate_limit()
def get_detalle_reserva():
    sheet = connect_sheet()
    return sheet.worksheet("detalle_reserva").get_all_records()


@retry_on_rate_limit()
def get_detalle_prereserva():
    sheet = connect_sheet()
    return sheet.worksheet("detalle_prereserva").get_all_records()


@retry_on_rate_limit()
def get_prereservas():
    sheet = connect_sheet()
    return sheet.worksheet("prereservas").get_all_records()

@retry_on_rate_limit()
def get_detalle_prereserva():
    sheet = connect_sheet()
    return sheet.worksheet("detalle_prereserva").get_all_records()

@retry_on_rate_limit()
def get_usuarios():
    sheet = connect_sheet()
    return sheet.worksheet("usuarios").get_all_records()

@retry_on_rate_limit()
def get_clientes():
    sheet = connect_sheet()
    return sheet.worksheet("clientes").get_all_records()

@retry_on_rate_limit()
def get_categorias():
    sheet = connect_sheet()
    return sheet.worksheet("categorias").get_all_records()
