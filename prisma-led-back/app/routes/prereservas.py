from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sheets_client import connect_sheet
from datetime import datetime, timedelta
import pandas as pd

prereservas_bp = Blueprint('prereservas_bp', __name__)

@prereservas_bp.route('/cliente', methods=['GET', 'OPTIONS'])
@jwt_required()
def obtener_reservas_del_cliente():
    if request.method == 'OPTIONS':
        return '', 200

    id_cliente = get_jwt_identity()
    sheet = connect_sheet()
    reservas_ws = sheet.worksheet("prereservas")
    reservas = reservas_ws.get_all_records()

    reservas_cliente = [
        r for r in reservas
        if r.get("id_cliente", "").strip() == id_cliente
    ]

    return jsonify(reservas_cliente), 200



@prereservas_bp.route('/detalle/<id_reserva>', methods=['GET'])
@jwt_required()
def obtener_detalle_reserva(id_reserva):
    identidad = get_jwt_identity()
    sheet = connect_sheet()

    # Conexión a las hojas
    reservas_ws = sheet.worksheet("prereservas")
    detalle_ws = sheet.worksheet("detalle_prereserva")
    pantallas_ws = sheet.worksheet("pantallas")
    tarifas_ws = sheet.worksheet("tarifas")

    # Cargar los datos
    reservas = reservas_ws.get_all_records()
    detalles = detalle_ws.get_all_records()
    pantallas = pantallas_ws.get_all_records()
    tarifas = tarifas_ws.get_all_records()

    # Mapeos de apoyo
    pantallas_dict = {p["id_pantalla"]: p for p in pantallas}
    tarifas_dict = {t["codigo_tarifa"]: t for t in tarifas}

    # Buscar la reserva del cliente
    reserva = next(
        (r for r in reservas if r["id_prereserva"] == id_reserva and r["id_cliente"] == identidad),
        None
    )
    if not reserva:
        return jsonify({"error": "Preeserva no encontrada o no autorizada"}), 404

    # Buscar detalles de la reserva
    pantallas_resultado = []
    for d in detalles:
        if d["id_prereserva"] == id_reserva:
            id_pantalla = d["id_pantalla"]
            pantalla = pantallas_dict.get(id_pantalla, {})
            tarifa = tarifas_dict.get(d["codigo_tarifa"], {})

            segundos = int(tarifa.get("duracion_seg", 0))
            precio = int(tarifa.get("precio_semana", 0)) * 1  # multiplicador por semana opcional

            pantallas_resultado.append({
                "id": id_pantalla,
                "cilindro": pantalla.get("cilindro"),
                "identificador": pantalla.get("identificador"),
                "segundos": segundos,
                "precio": precio,
            })

    return jsonify({
        "id_reserva": reserva["id_prereserva"],
        "fecha_creacion":reserva["fecha_creacion"] ,
        "fecha_inicio": reserva["fecha_inicio"],
        "duracion": (  # calcular semanas desde fecha_inicio y fecha_fin si duracion no está explícita
            (pd.to_datetime(reserva["fecha_fin"]) - pd.to_datetime(reserva["fecha_inicio"])).days // 7
        ),
        "categoria": detalles[0]["categoria"] if detalles else "",
        "pantallas": pantallas_resultado
    }), 200
