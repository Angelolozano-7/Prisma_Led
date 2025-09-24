"""
Rutas relacionadas con reservas y disponibilidad en prisma-led-back.

Este módulo expone endpoints para:
- Consultar la disponibilidad de pantallas para reservas y prereservas.
- Obtener tarifas y detalles de pantallas.
- Consultar reservas del cliente autenticado, incluyendo detalles completos.

Características clave:
- Lógica avanzada para calcular ocupación de pantallas por segundos y detectar conflictos de fechas y categorías.
- Integración con Google Sheets para obtener y actualizar datos de pantallas, tarifas, reservas y prereservas.
- Rate limiting para proteger los endpoints contra abuso.
- Uso de JWT para autenticación y protección de rutas.
- Funciones auxiliares para calcular ocupación, conflictos y lógica de negocio de disponibilidad.

Futuro desarrollador:
- Puedes agregar endpoints para crear, modificar o eliminar reservas desde aquí.
- Si cambias la estructura de las hojas de Google Sheets, ajusta los mapeos y validaciones en las funciones auxiliares.
- El manejo de estados de pantalla (disponible, parcial, reservado, ocupado, restringido) puede ser extendido para nuevas reglas de negocio.
- El cálculo de ocupación y conflictos está desacoplado y puede ser reutilizado en otros módulos.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import pandas as pd
from app.extensions import limiter
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
    """
    Determina si dos intervalos de fechas se cruzan.

    Args:
        f1_inicio (str): Fecha de inicio del primer intervalo (YYYY-MM-DD).
        f1_fin (str): Fecha de fin del primer intervalo (YYYY-MM-DD).
        f2_inicio (str): Fecha de inicio del segundo intervalo (YYYY-MM-DD).
        f2_fin (str): Fecha de fin del segundo intervalo (YYYY-MM-DD).

    Returns:
        bool: True si los intervalos se cruzan, False en caso contrario.
    """
    i1 = datetime.strptime(f1_inicio, "%Y-%m-%d")
    f1 = datetime.strptime(f1_fin, "%Y-%m-%d")
    return i1 <= f2_fin and f2_inicio <= f1

def construir_mapa_tarifas(tarifas_sheet):
    """
    Construye un diccionario de códigos de tarifa a duración en segundos.

    Args:
        tarifas_sheet (list): Lista de dicts con datos de tarifas.

    Returns:
        dict: {codigo_tarifa: duracion_seg}
    """
    codigos = {}
    for row in tarifas_sheet:
        codigos[row["codigo_tarifa"]] = int(row["duracion_seg"])
    return codigos

def segundos_ocupados_en_intervalo(detalles_dict, reservas, fecha_inicio, fecha_fin, codigos_tarifa):
    """
    Calcula los segundos ocupados por pantalla en un intervalo de fechas.

    Args:
        detalles_dict (dict): Detalles de reservas/prereservas por ID.
        reservas (list): Lista de reservas/prereservas.
        fecha_inicio (datetime): Fecha de inicio del intervalo.
        fecha_fin (datetime): Fecha de fin del intervalo.
        codigos_tarifa (dict): Mapa de códigos de tarifa a segundos.

    Returns:
        dict: {id_pantalla: segundos_ocupados}
    """
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
    """
    Obtiene los conflictos de ocupación para una pantalla en un intervalo de fechas.

    Args:
        detalles_dict (dict): Detalles de reservas/prereservas por ID.
        reservas (list): Lista de reservas/prereservas.
        id_pantalla (str): ID de la pantalla a consultar.
        fecha_inicio (datetime): Fecha de inicio del intervalo.
        fecha_fin (datetime): Fecha de fin del intervalo.

    Returns:
        list: Lista de tuplas (fecha_inicio, fecha_fin) de los conflictos encontrados.
    """
    conflictos = []
    for r in reservas:
        key = r.get("id_reserva") or r.get("id_prereserva")
        pantallas_en_r = [p["id_pantalla"] for p in detalles_dict.get(key, [])]
        if id_pantalla in pantallas_en_r and hay_cruce_de_fechas(r["fecha_inicio"], r["fecha_fin"], fecha_inicio, fecha_fin):
            conflictos.append((r["fecha_inicio"], r["fecha_fin"]))
    return conflictos

@reservas_bp.route('/disponibilidad', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def disponibilidad():
    """
    Endpoint para consultar la disponibilidad de pantallas.

    Calcula el estado de cada pantalla (disponible, parcial, reservado, ocupado, restringido)
    según reservas, prereservas, categoría y fechas solicitadas.

    Returns:
        Response: JSON con el estado de cada pantalla y código HTTP 200.
    """
    identidad = get_jwt_identity()
    data = request.get_json()
    excluir_prereserva_id = data.get("excluir_prereserva_id")  # Permite excluir la prereserva propia en edición

    fecha_inicio = datetime.strptime(data["fecha_inicio"], "%Y-%m-%d")
    semanas = int(data["duracion_semanas"])
    if semanas <= 0 or semanas > 52:
        return jsonify({"error": "Duración no permitida"}), 400
    fecha_fin = fecha_inicio + timedelta(weeks=semanas)
    categoria_cliente = data["categoria"]

    pantallas = get_pantallas()
    reservas = get_reservas()
    prereservas = get_prereservas()
    detalle_reserva_raw = get_detalle_reserva()
    detalle_prereserva_raw = get_detalle_prereserva()
    # Filtrar las prereservas excluidas (solo si el cliente está editando la suya)
    if excluir_prereserva_id:
        prereservas = [p for p in prereservas if p["id_prereserva"] != excluir_prereserva_id]
        detalle_prereserva_raw = [d for d in detalle_prereserva_raw if d["id_prereserva"] != excluir_prereserva_id]

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
        if conflictos_prereserva:
            estado = "parcial" if segundos_disponibles > 0 else "reservado"
            mensaje = "Pauta activa periodo: " + ", ".join([f"{f[0]} a {f[1]}" for f in conflictos_prereserva])
        elif segundos_disponibles < 60:
            estado = "parcial"
            mensaje = f"Disponible parcialmente ({segundos_disponibles} segundos libres)"
        else:
            estado = "disponible"
            mensaje = "Pantalla completamente disponible"
        if estado != "reservado":
            if conflictos_reserva:
                estado = "parcial" if segundos_disponibles > 0 else "ocupado"
                mensaje = "Pauta activa periodo: " + ", ".join([f"{f[0]} a {f[1]}" for f in conflictos_reserva])
            elif segundos_disponibles < 60:
                estado = "parcial"
                mensaje = f"Disponible parcialmente ({segundos_disponibles} segundos libres)"
            else:
                estado = "disponible"
                mensaje = "Pantalla completamente disponible"
        if estado in ("disponible" , "parcial"):
            for r in reservas:
                pantallas_en_r = [p["id_pantalla"] for p in detalle_reserva_dict.get(r["id_reserva"], [])]
                cilindros_cruzados = [p for p, c in pantallas_dict.items() if c == cilindro]
                detalles = detalle_reserva_dict.get(r["id_reserva"], [])
                categoria = detalles[0].get("categoria") if detalles else None
                if r["id_cliente"] != identidad and categoria == categoria_cliente:
                    if any(p in pantallas_en_r for p in cilindros_cruzados):
                        if hay_cruce_de_fechas(r["fecha_inicio"], r["fecha_fin"], fecha_inicio, fecha_fin):
                            estado = "restringido"
                            mensaje = f"Conflicto de categoría con otra pauta en cilindro {cilindro}"
                            break

            for r in prereservas:
                pantallas_en_r = [p["id_pantalla"] for p in detalle_prereserva_dict.get(r["id_prereserva"], [])]
                cilindros_cruzados = [p for p, c in pantallas_dict.items() if c == cilindro]
                detalles = detalle_prereserva_dict.get(r["id_prereserva"], [])
                categoria = detalles[0].get("categoria") if detalles else None
                if r["id_cliente"] != identidad and categoria == categoria_cliente:
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
@limiter.limit("20 per minute")
def obtener_tarifas():
    """
    Endpoint para obtener todas las tarifas.

    Returns:
        Response: JSON con la lista de tarifas y código HTTP 200.
    """
    tarifas = get_tarifas()
    return jsonify(tarifas), 200


@reservas_bp.route('/cliente', methods=['GET', 'OPTIONS'])
@jwt_required()
def obtener_reservas_del_cliente():
    """
    Endpoint para obtener las reservas del cliente autenticado.

    Returns:
        Response: JSON con la lista de reservas del cliente y código HTTP 200.
    """
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
    """
    Endpoint para obtener las reservas completas del cliente autenticado,
    incluyendo detalles de pantallas y tarifas.

    Returns:
        Response: JSON con la lista de reservas completas y código HTTP 200.
    """
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
            "subtotal": sum(p["precio"] for p in pantallas_resultado),
            "uxid": r.get("uxid", None)
        })

    return jsonify(resultado), 200