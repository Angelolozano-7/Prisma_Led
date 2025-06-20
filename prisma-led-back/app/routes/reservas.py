from flask import Blueprint, jsonify, request
from app.services.sheets_client import connect_sheet

reservas_bp = Blueprint('reservas_bp', __name__)

@reservas_bp.route('/cliente/<id_cliente>', methods=['GET', 'OPTIONS'])
def obtener_reservas_del_cliente(id_cliente):
    if request.method == 'OPTIONS':
        return '', 200

    sheet = connect_sheet()
    reservas_ws = sheet.worksheet("reservas")
    reservas = reservas_ws.get_all_records()

    reservas_cliente = [
        r for r in reservas
        if r.get("id_cliente", "").strip() == id_cliente
    ]

    return jsonify(reservas_cliente), 200
