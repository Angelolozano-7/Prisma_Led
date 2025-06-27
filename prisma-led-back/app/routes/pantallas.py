from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.services.sheets_client import get_pantallas

pantallas_bp = Blueprint('pantallas_bp', __name__)

@pantallas_bp.route('', methods=['GET'])
@jwt_required()
def obtener_pantallas():
    pantallas = get_pantallas()
    return jsonify(pantallas), 200
