"""
Módulo de configuración para la aplicación Flask de prisma-led-back.

Carga variables de entorno y define la clase Config con los parámetros globales
para seguridad, acceso a Google Sheets, JWT y correo electrónico.
"""

import os
from dotenv import load_dotenv
from datetime import timedelta


load_dotenv()

class Config:
    """
    Clase de configuración global para la aplicación Flask.

    Los atributos se cargan desde variables de entorno y se utilizan para:
    - Seguridad (SECRET_KEY, JWT_SECRET_KEY)
    - Acceso a Google Sheets (SPREADSHEET_ID, GOOGLE_CREDENTIALS_PATH)
    - Configuración de correo electrónico (MAIL_SERVER, MAIL_PORT, etc.)
    """
    SECRET_KEY = os.getenv("SECRET_KEY")
    SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")
    GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = int(os.getenv("MAIL_PORT"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS") == 'True'
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")

