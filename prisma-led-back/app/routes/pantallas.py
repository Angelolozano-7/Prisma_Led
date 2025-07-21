"""
Rutas relacionadas con la consulta de pantallas en prisma-led-back.

Incluye el endpoint protegido para obtener todas las pantallas desde Google Sheets.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.services.sheets_client import get_pantallas

pantallas_bp = Blueprint('pantallas_bp', __name__)

@pantallas_bp.route('', methods=['GET'])
@jwt_required()
def obtener_pantallas():
    """
    Endpoint para obtener todas las pantallas.

    Requiere autenticación JWT.

    Returns:
        Response: JSON con la lista de pantallas y código HTTP 200.
    """
    pantallas = get_pantallas()
    return jsonify(pantallas), 200
