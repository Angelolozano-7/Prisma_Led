from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sheets_client import connect_sheet

reservas_bp = Blueprint('reservas_bp', __name__)

@reservas_bp.route('/cliente', methods=['GET', 'OPTIONS'])
@jwt_required()
def obtener_reservas_del_cliente():
    if request.method == 'OPTIONS':
        return '', 200

    id_cliente = get_jwt_identity()  # Se obtiene desde el token

    sheet = connect_sheet()
    reservas_ws = sheet.worksheet("reservas")
    reservas = reservas_ws.get_all_records()

    reservas_cliente = [
        r for r in reservas
        if r.get("id_cliente", "").strip() == id_cliente
    ]

    return jsonify(reservas_cliente), 200
