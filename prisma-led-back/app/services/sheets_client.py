import gspread
from google.oauth2.service_account import Credentials
from flask import current_app
from app.services.retry_utils import retry_on_rate_limit

# 🧠 Variable global que guarda la conexión a la hoja de cálculo
_cached_spreadsheet = None

def connect_sheet():
    global _cached_spreadsheet

    if _cached_spreadsheet:
        return _cached_spreadsheet

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]

    credentials_path = current_app.config["GOOGLE_CREDENTIALS_PATH"]
    spreadsheet_id = current_app.config["SPREADSHEET_ID"]

    credentials = Credentials.from_service_account_file(credentials_path, scopes=scopes)
    client = gspread.authorize(credentials)
    _cached_spreadsheet = client.open_by_key(spreadsheet_id)

    return _cached_spreadsheet

# ✅ Todas las funciones ahora reutilizan la misma instancia
@retry_on_rate_limit()
def get_tarifas():
    return connect_sheet().worksheet("tarifas").get_all_records()

@retry_on_rate_limit()
def get_pantallas():
    return connect_sheet().worksheet("pantallas").get_all_records()

@retry_on_rate_limit()
def get_reservas():
    return connect_sheet().worksheet("reservas").get_all_records()

@retry_on_rate_limit()
def get_prereservas():
    return connect_sheet().worksheet("prereservas").get_all_records()

@retry_on_rate_limit()
def get_detalle_reserva():
    return connect_sheet().worksheet("detalle_reserva").get_all_records()

@retry_on_rate_limit()
def get_detalle_prereserva():
    return connect_sheet().worksheet("detalle_prereserva").get_all_records()

@retry_on_rate_limit()
def get_usuarios():
    return connect_sheet().worksheet("usuarios").get_all_records()

@retry_on_rate_limit()
def get_clientes():
    return connect_sheet().worksheet("clientes").get_all_records()

@retry_on_rate_limit()
def get_categorias():
    return connect_sheet().worksheet("categorias").get_all_records()
