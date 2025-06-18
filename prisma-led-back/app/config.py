import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    SPREADSHEET_ID = os.getenv("SPREADSHEET_ID")
    GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

