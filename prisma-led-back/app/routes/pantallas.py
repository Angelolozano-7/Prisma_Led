from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sheets_client import connect_sheet
from datetime import datetime, timedelta
import pandas as pd

pantallas_bp = Blueprint('pantallas_bp', __name__)



@pantallas_bp.route('', methods=['GET'])
@jwt_required()
def obtener_pantallas():
    sheet = connect_sheet()
    pantallas_ws = sheet.worksheet("pantallas")
    pantallas = pantallas_ws.get_all_records()
    return jsonify(pantallas), 200