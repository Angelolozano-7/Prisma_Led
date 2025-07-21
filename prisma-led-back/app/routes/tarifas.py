"""
Rutas relacionadas con la consulta de tarifas en prisma-led-back.

Incluye el endpoint protegido para obtener todas las tarifas desde Google Sheets.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.services.sheets_client import get_tarifas  # importa la nueva función decorada

tarifas_bp = Blueprint('tarifas_bp', __name__)

@tarifas_bp.route('', methods=['GET'])
@jwt_required()
def obtener_tarifas():
    """
    Endpoint para obtener todas las tarifas.

    Requiere autenticación JWT.

    Returns:
        Response: JSON con la lista de tarifas y código HTTP 200.
    """
    tarifas = get_tarifas()
    return jsonify(tarifas), 200
