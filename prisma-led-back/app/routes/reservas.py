from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import pandas as pd

from app.services.sheets_client import (
    get_tarifas,
    get_pantallas,
    get_reservas,
    get_prereservas,
    get_detalle_reserva,
    get_detalle_prereserva
)

reservas_bp = Blueprint('reservas_bp', __name__)


def hay_cruce_de_fechas(f1_inicio, f1_fin, f2_inicio, f2_fin):
    i1 = datetime.strptime(f1_inicio, "%Y-%m-%d")
    f1 = datetime.strptime(f1_fin, "%Y-%m-%d")
    return i1 <= f2_fin and f2_inicio <= f1

def construir_mapa_tarifas(tarifas_sheet):
    codigos = {}
    for row in tarifas_sheet:
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

def obtener_conflictos(detalles_dict, reservas, id_pantalla, fecha_inicio, fecha_fin):
    conflictos = []
    for r in reservas:
        key = r.get("id_reserva") or r.get("id_prereserva")
        pantallas_en_r = [p["id_pantalla"] for p in detalles_dict.get(key, [])]
        if id_pantalla in pantallas_en_r and hay_cruce_de_fechas(r["fecha_inicio"], r["fecha_fin"], fecha_inicio, fecha_fin):
            conflictos.append((r["fecha_inicio"], r["fecha_fin"]))
    return conflictos

@reservas_bp.route('/disponibilidad', methods=['POST'])
@jwt_required()
def disponibilidad():
    identidad = get_jwt_identity()
    data = request.get_json()
    fecha_inicio = datetime.strptime(data["fecha_inicio"], "%Y-%m-%d")
    semanas = int(data["duracion_semanas"])
    fecha_fin = fecha_inicio + timedelta(weeks=semanas)
    categoria_cliente = data["categoria"]

    pantallas = get_pantallas()
    reservas = get_reservas()
    prereservas = get_prereservas()
    detalle_reserva_raw = get_detalle_reserva()
    detalle_prereserva_raw = get_detalle_prereserva()
    tarifas_sheet = get_tarifas()

    codigos_tarifa = construir_mapa_tarifas(tarifas_sheet)
    pantallas_dict = {p["id_pantalla"]: p["cilindro"] for p in pantallas}
    pantallas_dict_info = {p["id_pantalla"]: p for p in pantallas}

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
        conflictos_reserva = obtener_conflictos(detalle_reserva_dict, reservas, id_pantalla, fecha_inicio, fecha_fin)
        conflictos_prereserva = obtener_conflictos(detalle_prereserva_dict, prereservas, id_pantalla, fecha_inicio, fecha_fin)
        conflictos = conflictos_reserva + conflictos_prereserva

        if conflictos:
            estado = "parcial" if segundos_disponibles > 0 else "ocupado"
            mensaje = "Pauta activa periodo: " + ", ".join([f"{f[0]} a {f[1]}" for f in conflictos])
        elif segundos_disponibles < 60:
            estado = "parcial"
            mensaje = f"Disponible parcialmente ({segundos_disponibles} segundos libres)"
        else:
            estado = "disponible"
            mensaje = "Pantalla completamente disponible"

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
    tarifas = get_tarifas()
    return jsonify(tarifas), 200


@reservas_bp.route('/cliente', methods=['GET', 'OPTIONS'])
@jwt_required()
def obtener_reservas_del_cliente():
    if request.method == 'OPTIONS':
        return '', 200

    id_cliente = get_jwt_identity()
    reservas = get_reservas()

    reservas_cliente = [
        r for r in reservas
        if r.get("id_cliente", "").strip() == id_cliente
    ]
    return jsonify(reservas_cliente), 200


@reservas_bp.route('/cliente/completo', methods=['GET'])
@jwt_required()
def obtener_reservas_cliente_completo():
    identidad = get_jwt_identity()
    reservas = get_reservas()
    detalles = get_detalle_reserva()
    pantallas = {p["id_pantalla"]: p for p in get_pantallas()}
    tarifas = {t["codigo_tarifa"]: t for t in get_tarifas()}

    # Filtrar reservas del cliente
    reservas_cliente = [r for r in reservas if r.get("id_cliente", "").strip() == identidad]
    detalle_por_reserva = {}
    for d in detalles:
        detalle_por_reserva.setdefault(d["id_reserva"], []).append(d)

    resultado = []
    for r in reservas_cliente:
        pantallas_resultado = []
        detalles_r = detalle_por_reserva.get(r["id_reserva"], [])
        for d in detalles_r:
            tarifa = tarifas.get(d["codigo_tarifa"], {})
            pantalla = pantallas.get(d["id_pantalla"], {})
            if not tarifa or not pantalla:
                continue

            segundos = int(tarifa.get("duracion_seg", 0))
            precio = int(tarifa.get("precio_semana", 0))

            pantallas_resultado.append({
                "id": d["id_pantalla"],
                "cilindro": pantalla.get("cilindro"),
                "identificador": pantalla.get("identificador"),
                "segundos": segundos,
                "precio": precio,
            })

        resultado.append({
            "id_reserva": r["id_reserva"],
            "fecha_inicio": r["fecha_inicio"],
            "fecha_fin": r["fecha_fin"],
            "categoria": detalles_r[0]["categoria"] if detalles_r else "",
            "duracion": (pd.to_datetime(r["fecha_fin"]) - pd.to_datetime(r["fecha_inicio"])).days // 7,
            "pantallas": pantallas_resultado,
            "subtotal": sum(p["precio"] for p in pantallas_resultado)
        })

    return jsonify(resultado), 200