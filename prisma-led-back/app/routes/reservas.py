from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sheets_client import connect_sheet
from datetime import datetime, timedelta

reservas_bp = Blueprint('reservas_bp', __name__)

@reservas_bp.route('/cliente', methods=['GET', 'OPTIONS'])
@jwt_required()
def obtener_reservas_del_cliente():
    if request.method == 'OPTIONS':
        return '', 200

    id_cliente = get_jwt_identity()
    sheet = connect_sheet()
    reservas_ws = sheet.worksheet("reservas")
    reservas = reservas_ws.get_all_records()

    reservas_cliente = [
        r for r in reservas
        if r.get("id_cliente", "").strip() == id_cliente
    ]

    return jsonify(reservas_cliente), 200

def hay_cruce_de_fechas(f1_inicio, f1_fin, f2_inicio, f2_fin):
    i1 = datetime.strptime(f1_inicio, "%Y-%m-%d")
    f1 = datetime.strptime(f1_fin, "%Y-%m-%d")
    return i1 <= f2_fin and f2_inicio <= f1

def construir_mapa_tarifas(tarifas_sheet):
    tarifas = tarifas_sheet.get_all_records()
    codigos = {}
    for row in tarifas:
        codigos[row["codigo_tarifa"]] = int(row["duracion_seg"])
    return codigos

def segundos_ocupados_en_intervalo(detalles_dict, reservas, fecha_inicio, fecha_fin, codigos_tarifa):
    ocupacion = {}
    for r in reservas:
        if not hay_cruce_de_fechas(r["fecha_inicio"], r["fecha_fin"], fecha_inicio, fecha_fin):
            continue
        key = r.get("id_reserva") or r.get("id_prereserva")
        pantallas = detalles_dict.get(key, [])
        for p in pantallas:
            id_pantalla = p["id_pantalla"]
            codigo = p.get("codigo_tarifa")
            segundos = codigos_tarifa.get(codigo, 0)
            ocupacion[id_pantalla] = ocupacion.get(id_pantalla, 0) + segundos
    return ocupacion

@reservas_bp.route('/disponibilidad', methods=['POST'])
@jwt_required()
def disponibilidad():
    identidad = get_jwt_identity()
    data = request.get_json()
    fecha_inicio = datetime.strptime(data["fecha_inicio"], "%Y-%m-%d")
    semanas = int(data["duracion_semanas"])
    fecha_fin = fecha_inicio + timedelta(weeks=semanas)
    categoria_cliente = data["categoria"]

    sheet = connect_sheet()
    pantallas_ws = sheet.worksheet("pantallas")
    reservas_ws = sheet.worksheet("reservas")
    prereservas_ws = sheet.worksheet("prereservas")
    detalle_reserva_ws = sheet.worksheet("detalle_reserva")
    detalle_prereserva_ws = sheet.worksheet("detalle_prereserva")
    tarifas_ws = sheet.worksheet("tarifas")

    codigos_tarifa = construir_mapa_tarifas(tarifas_ws)

    pantallas = pantallas_ws.get_all_records()
    pantallas_dict = {p["id_pantalla"]: p["cilindro"] for p in pantallas}
    pantallas_dict_info = {p["id_pantalla"]: p for p in pantallas}

    reservas = reservas_ws.get_all_records()
    prereservas = prereservas_ws.get_all_records()
    detalle_reserva_raw = detalle_reserva_ws.get_all_records()
    detalle_prereserva_raw = detalle_prereserva_ws.get_all_records()

    detalle_reserva_dict = {}
    for row in detalle_reserva_raw:
        detalle_reserva_dict.setdefault(row["id_reserva"], []).append(row)

    detalle_prereserva_dict = {}
    for row in detalle_prereserva_raw:
        detalle_prereserva_dict.setdefault(row["id_prereserva"], []).append(row)

    ocupados_reserva = segundos_ocupados_en_intervalo(detalle_reserva_dict, reservas, fecha_inicio, fecha_fin, codigos_tarifa)
    ocupados_prereserva = segundos_ocupados_en_intervalo(detalle_prereserva_dict, prereservas, fecha_inicio, fecha_fin, codigos_tarifa)

    ocupacion_total = {}
    for id_pantalla in pantallas_dict:
        total = ocupados_reserva.get(id_pantalla, 0) + ocupados_prereserva.get(id_pantalla, 0)
        ocupacion_total[id_pantalla] = total

    resultado = {}

    for id_pantalla, cilindro in pantallas_dict.items():
        segundos_disponibles = max(0, 60 - ocupacion_total.get(id_pantalla, 0))

        if segundos_disponibles <= 0:
            estado = "ocupado"
            mensaje = "Pantalla completamente ocupada"
            for r in reservas:
                pantallas_en_r = [p["id_pantalla"] for p in detalle_reserva_dict.get(r["id_reserva"], [])]
                if id_pantalla in pantallas_en_r and hay_cruce_de_fechas(r["fecha_inicio"], r["fecha_fin"], fecha_inicio, fecha_fin):
                    mensaje = f"Reservada del {r['fecha_inicio']} al {r['fecha_fin']}"
                    break

        elif segundos_disponibles < 60:
            estado = "parcial"
            mensaje = f"Disponible parcialmente ({segundos_disponibles} segundos libres)"

        else:
            estado = "disponible"
            mensaje = "Pantalla completamente disponible"

        if estado == "disponible":
            for p in prereservas:
                pantallas_en_p = [x["id_pantalla"] for x in detalle_prereserva_dict.get(p["id_prereserva"], [])]
                if id_pantalla in pantallas_en_p and hay_cruce_de_fechas(p["fecha_inicio"], p["fecha_fin"], fecha_inicio, fecha_fin):
                    estado = "reservado"
                    mensaje = f"Prereservada del {p['fecha_inicio']} al {p['fecha_fin']}"
                    break

        if estado == "disponible":
            for r in reservas:
                pantallas_en_r = [p["id_pantalla"] for p in detalle_reserva_dict.get(r["id_reserva"], [])]
                cilindros_cruzados = [p for p, c in pantallas_dict.items() if c == cilindro]
                if r["id_cliente"] != identidad and r.get("categoria") == categoria_cliente:
                    if any(p in pantallas_en_r for p in cilindros_cruzados):
                        if hay_cruce_de_fechas(r["fecha_inicio"], r["fecha_fin"], fecha_inicio, fecha_fin):
                            estado = "restringido"
                            mensaje = f"Conflicto de categoría con otra pauta en cilindro {cilindro}"
                            break

        resultado[id_pantalla] = {
            "estado": estado,
            "mensaje": mensaje,
            "cilindro": cilindro,
            "identificador": pantallas_dict_info.get(id_pantalla, {}).get("identificador", ""),
            "segundos_disponibles": segundos_disponibles
        }

    resultado_str_keys = {str(k): v for k, v in resultado.items()}
    return jsonify(resultado_str_keys), 200

@reservas_bp.route('/tarifas', methods=['GET'])
@jwt_required()
def obtener_tarifas():
    sheet = connect_sheet()
    tarifas_ws = sheet.worksheet("tarifas")
    tarifas = tarifas_ws.get_all_records()
    return jsonify(tarifas), 200
