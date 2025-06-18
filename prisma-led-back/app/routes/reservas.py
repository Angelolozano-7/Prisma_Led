from flask import Blueprint, jsonify
from app.services.sheets_client import connect_sheet
from flask_jwt_extended import jwt_required, get_jwt_identity

reservas_bp = Blueprint('reservas_bp', __name__)

@reservas_bp.route("/", methods=["GET"])
@jwt_required()
def get_reservas():
    user = get_jwt_identity()
    print(f"Consulta realizada por: {user['correo']}")
    sheet = connect_sheet().worksheet("reservas")
    data = sheet.get_all_records()
    return jsonify(data)
