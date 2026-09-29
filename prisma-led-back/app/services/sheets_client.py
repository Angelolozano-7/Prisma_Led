"""
Capa de acceso a Google Sheets para PrismaLED.

Centraliza autenticación, reutilización de la conexión y acceso a hojas.

Nomenclatura legacy: prereservas / detalle_prereserva almacenan reservas del
cliente; reservas / detalle_reserva corresponden funcionalmente a pautas.
Los nombres físicos se conservan por compatibilidad.
"""


import gspread
from google.oauth2.service_account import Credentials
from flask import current_app
from app.services.retry_utils import retry_on_rate_limit

# 🧠 Variable global que guarda la conexión a la hoja de cálculo
_cached_spreadsheet = None

def connect_sheet():
    """
    Establece y retorna la conexión a la hoja de cálculo de Google Sheets.

    Utiliza credenciales y el ID de la hoja definidos en la configuración de la aplicación.
    Reutiliza la instancia para mejorar el rendimiento.

    Returns:
        gspread.Spreadsheet: Instancia conectada a la hoja de cálculo.
    """
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

@retry_on_rate_limit()
def get_tarifas():
    """
    Obtiene todos los registros de la hoja 'tarifas'.

    Returns:
        list: Lista de diccionarios con los datos de tarifas.
    """
    tarifas = connect_sheet().worksheet("tarifas").get_all_records()
    return tarifas

@retry_on_rate_limit()
def get_pantallas():
    """
    Obtiene todos los registros de la hoja 'pantallas'.

    Returns:
        list: Lista de diccionarios con los datos de pantallas.
    """
    return connect_sheet().worksheet("pantallas").get_all_records()

@retry_on_rate_limit()
def get_reservas():
    """
    Obtiene los registros de la hoja legacy 'reservas', que funcionalmente corresponden a pautas.

    Returns:
        list: Lista de diccionarios con los datos de reservas.
    """
    return connect_sheet().worksheet("reservas").get_all_records()

@retry_on_rate_limit()
def get_prereservas():
    """
    Obtiene los registros de la hoja legacy 'prereservas', que funcionalmente corresponden a reservas.

    Returns:
        list: Lista de diccionarios con los datos de prereservas.
    """
    return connect_sheet().worksheet("prereservas").get_all_records()

@retry_on_rate_limit()
def get_detalle_reserva():
    """
    Obtiene todos los registros de la hoja 'detalle_reserva'.

    Returns:
        list: Lista de diccionarios con los detalles de reservas.
    """
    return connect_sheet().worksheet("detalle_reserva").get_all_records()

@retry_on_rate_limit()
def get_detalle_prereserva():
    """
    Obtiene todos los registros de la hoja 'detalle_prereserva'.

    Returns:
        list: Lista de diccionarios con los detalles de prereservas.
    """
    return connect_sheet().worksheet("detalle_prereserva").get_all_records()

@retry_on_rate_limit()
def get_usuarios():
    """
    Obtiene todos los registros de la hoja 'usuarios'.

    Returns:
        list: Lista de diccionarios con los datos de usuarios.
    """
    return connect_sheet().worksheet("usuarios").get_all_records()

@retry_on_rate_limit()
def get_clientes():
    """
    Obtiene todos los registros de la hoja 'clientes'.

    Returns:
        list: Lista de diccionarios con los datos de clientes.
    """
    return connect_sheet().worksheet("clientes").get_all_records()

@retry_on_rate_limit()
def get_categorias():
    """
    Obtiene todos los registros de la hoja 'categorias'.

    Returns:
        list: Lista de diccionarios con los datos de categorías.
    """
    return connect_sheet().worksheet("categorias").get_all_records()

@retry_on_rate_limit()
def get_ciudades():
    """
    Obtiene todos los registros de la hoja 'ciudades'.

    Returns:
        list: Lista de diccionarios con los datos de ciudades.
    """
    return connect_sheet().worksheet("ciudades").get_all_records()

@retry_on_rate_limit()
def add_ciudad(nombre_ciudad):
    """
    Agrega una ciudad a la hoja 'ciudades' si no existe aún (ignorando mayúsculas).

    Args:
        nombre_ciudad (str): Nombre de la ciudad a agregar.

    Returns:
        bool: True si fue agregada, False si ya existía.
    """
    ws = connect_sheet().worksheet("ciudades")
    ciudades = [c["nombre_ciudad"].strip().lower() for c in ws.get_all_records()]

    if nombre_ciudad.strip().lower() in ciudades:
        return False

    ws.append_row([nombre_ciudad.strip()])
    return True
