from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import pandas as pd
import uuid
from flask_mail import Message
from app import mail
import traceback
from app.services.retry_utils import retry_on_rate_limit
from app.services.validadores import validar_detalle_prereserva
from app.extensions import pre_reserva_lock
from app.extensions import detalle_pre_reserva_lock

from app.services.sheets_client import (
    connect_sheet,
    get_prereservas,
    get_detalle_prereserva,
    get_tarifas,
    get_pantallas
)

prereservas_bp = Blueprint('prereservas_bp', __name__)

def generar_id_appsheet():
    return uuid.uuid4().hex[:8]

@prereservas_bp.route('/cliente', methods=['GET', 'OPTIONS'])
@jwt_required()
def obtener_reservas_del_cliente():
    if request.method == 'OPTIONS':
        return '', 200

    id_cliente = get_jwt_identity()
    reservas = get_prereservas()

    reservas_cliente = [
        r for r in reservas
        if r.get("id_cliente", "").strip() == id_cliente
    ]
    return jsonify(reservas_cliente), 200


@prereservas_bp.route('/detalle/<id_reserva>', methods=['GET'])
@jwt_required()
def obtener_detalle_reserva(id_reserva):
    identidad = get_jwt_identity()

    reservas = get_prereservas()
    detalles = get_detalle_prereserva()
    pantallas = get_pantallas()
    tarifas = get_tarifas()

    pantallas_dict = {p["id_pantalla"]: p for p in pantallas}
    tarifas_dict = {t["codigo_tarifa"]: t for t in tarifas}

    reserva = next(
        (r for r in reservas if r["id_prereserva"] == id_reserva and r["id_cliente"] == identidad),
        None
    )
    if not reserva:
        return jsonify({"error": "Pre-reserva no encontrada o no autorizada"}), 404

    pantallas_resultado = []
    for d in detalles:
        if d["id_prereserva"] == id_reserva:
            id_pantalla = d["id_pantalla"]
            pantalla = pantallas_dict.get(id_pantalla, {})
            tarifa = tarifas_dict.get(d["codigo_tarifa"], {})

            segundos = int(tarifa.get("duracion_seg", 0))
            precio = int(tarifa.get("precio_semana", 0)) * 1

            pantallas_resultado.append({
                "id": id_pantalla,
                "cilindro": pantalla.get("cilindro"),
                "identificador": pantalla.get("identificador"),
                "segundos": segundos,
                "precio": precio,
            })

    return jsonify({
        "id_reserva": reserva["id_prereserva"],
        "fecha_creacion": reserva["fecha_creacion"],
        "fecha_inicio": reserva["fecha_inicio"],
        "duracion": (
            (pd.to_datetime(reserva["fecha_fin"]) - pd.to_datetime(reserva["fecha_inicio"])).days // 7
        ),
        "categoria": detalles[0]["categoria"] if detalles else "",
        "pantallas": pantallas_resultado
    }), 200


@prereservas_bp.route('/crear', methods=['POST'])
@jwt_required()
def crear_prereserva():
    with pre_reserva_lock:
        try:
            data = request.get_json()
            id_cliente = get_jwt_identity()

            fecha_inicio = data.get("fecha_inicio")
            fecha_fin = data.get("fecha_fin")
            categoria = data.get("categoria")

            if not (fecha_inicio and fecha_fin and categoria):
                return jsonify({"error": "Datos incompletos"}), 400

            fecha_creacion = datetime.now().strftime("%Y-%m-%d")
            estado = "pendiente"

            id_prereserva = uuid.uuid4().hex[:8]

            sheet = connect_sheet()
            ws = sheet.worksheet("prereservas")
            ws.append_row([
                id_prereserva,
                id_cliente,
                fecha_inicio,
                fecha_fin,
                estado,
                fecha_creacion
            ])

            return jsonify({
                "id_prereserva": id_prereserva,
                "estado": estado,
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin
            }), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 500


@prereservas_bp.route('/detalle_prereserva/crear', methods=['POST'])
@jwt_required()
def crear_detalle_prereserva():
    with detalle_pre_reserva_lock:
        try:
            data = request.get_json()
            id_prereserva = data.get("id_prereserva")
            pantallas = data.get("pantallas", [])
            categoria = data.get("categoria")

            if not id_prereserva or not pantallas or not categoria:
                return jsonify({"error": "Faltan datos requeridos"}), 400
            es_valido, error_msg = validar_detalle_prereserva(id_prereserva, pantallas, categoria, get_jwt_identity())
            if not es_valido:
                # Si la validación falla, retornamos el mensaje de error
                return jsonify({"error": error_msg}), 409
            sheet = connect_sheet()
            detalle_ws = sheet.worksheet("detalle_prereserva")

            nuevas_filas = []

            for p in pantallas:
                codigo_tarifa = p["cod_tarifas"]

                fila = [
                    uuid.uuid4().hex[:8],
                    id_prereserva,
                    p["id_pantalla"],
                    categoria,
                    codigo_tarifa
                ]
                nuevas_filas.append(fila)

            detalle_ws.append_rows(nuevas_filas)
            return jsonify({"mensaje": "Detalle prereserva registrado", "registros": len(nuevas_filas)}), 201

        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": f"Error al guardar detalle: {str(e)}"}), 500


@prereservas_bp.route('/enviar-correo', methods=['POST'])
@jwt_required()
def enviar_correo_prereserva():
    with pre_reserva_lock:
        try:
            data = request.get_json()
            prereservas = get_prereservas()
            id_prereserva = data.get('id_prereserva')
            prereserva = next((p for p in prereservas if p["id_prereserva"] == str(id_prereserva)), None)
            if prereserva and prereserva.get("correo_enviado", "").strip().lower() == "sí":
                return jsonify({"error": "El correo ya fue enviado para esta pre-reserva"}), 409
            
            correo = data.get('correo')
            razon_social = data.get('razon_social')
            nit = data.get('nit')
            fecha_inicio = data.get('fecha_inicio')
            fecha_fin = data.get('fecha_fin')
            categoria = data.get('categoria')
            pantallas = data.get('pantallas')
            subtotal = data.get('subtotal')
            iva = data.get('iva')
            total = data.get('total')
            duracion = data.get('duracion')

            if not correo or not pantallas:
                return jsonify({"error": "Datos incompletos"}), 400

            # Construcción del HTML por pantalla
            pantalla_html = []
            for p in pantallas:
                semanas = duracion
                base = int(p['base'])
                precio = int(p['precio'])
                subtotal_pantalla = base * semanas
                descuento = p.get('descuento', 0)
                ahorro = subtotal_pantalla - precio

                linea = f"""
                <li style="margin-bottom: 12px;">
                    <strong>Pantalla {p['cilindro']}{p['identificador']}</strong> - {semanas} semana{'s' if semanas > 1 else ''}<br/>
                    Valor por semana: ${base:,.0f}<br/>
                    <strong>Subtotal ({semanas} semana{'s' if semanas > 1 else ''}) sin descuento:</strong> ${subtotal_pantalla:,.0f}<br/>
                """

                if descuento > 0:
                    linea += f"""
                    <strong>Total con descuento:</strong> ${precio:,.0f}<br/>
                    <div style='color:#dc2626; font-size:13px;'>
                        Descuento aplicado: -{descuento * 100:.1f}%<br/>
                        Ahorro: ${ahorro:,.0f}
                    </div>
                    """
                linea += "</li>"
                pantalla_html.append(linea)

            pantallas_html = "<ul>" + "".join(pantalla_html) + "</ul>"

            # Cuerpo del mensaje HTML
            cuerpo_html = f"""
                <div style="font-family:Arial, sans-serif; color:#333; font-size:15px; line-height:1.6;">
                    <p>Buenas tardes,</p>

                    <p>Le agradecemos por confiar en nosotros para que su marca llegue al corazón de Cali, el <strong>Bulevar del Río</strong>.</p>

                    <p>A continuación encontrará los detalles de su <strong style="color:#3B82F6;">pre-reserva #{id_prereserva}</strong>:</p>
                    
                    <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;" />

                    <p>
                        <strong>Razón Social:</strong> {razon_social}<br/>
                        <strong>NIT:</strong> {nit}<br/>
                        <strong>Correo:</strong> <a href="mailto:{correo}" style="color:#3B82F6;">{correo}</a><br/>
                    </p>
                    <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;" />
                    <p>
                        <strong>Fecha:</strong> {fecha_inicio} - {fecha_fin}<br/>
                        <strong>Categoría:</strong> {categoria}
                    </p>

                    {pantallas_html}
                    <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;" />
                    <p style="margin-top: 20px;">
                        <strong>Subtotal:</strong> ${subtotal:,.0f}<br/>
                        <strong>IVA (19%):</strong> ${iva:,.0f}<br/>
                        <strong style="font-size: 16px;">Total:</strong> <span style="font-size: 16px; font-weight: bold;">${total:,.0f}</span>
                    </p>

                    <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;" />

                    <p style="font-size:14px;"><strong>Información adicional:</strong></p>
                    <p style="font-size:14px;">
                        Su pre-reserva se encuentra en estado <strong style="color:#dc2626;">pendiente</strong>.
                        Recuerde que tiene <strong>5 días</strong> para compartir el video de la campaña. Si este aún está en producción, puede compartir una imagen de referencia.
                    </p>

                    <p style="font-size:14px;">
                        Posteriormente, el equipo técnico de <strong>Prisma Wall</strong> evaluará si el video cumple con las normativas de exposición al público de todas las edades y usted será notificado por este mismo medio.
                    </p>
                </div>
                """


            # Envío del correo
            msg = Message(
                subject=f" Confirmación de Prereserva #{id_prereserva} - Prisma Wall",
                recipients=[correo],
                html=cuerpo_html
            )
            mail.send(msg)
            sheet = connect_sheet()
            ws = sheet.worksheet("prereservas")

            # Buscar fila a actualizar
            fila = next((i for i, p in enumerate(prereservas) if p["id_prereserva"] == str(id_prereserva)), None)
            if fila is not None:
                col_idx = list(prereservas[0].keys()).index("correo_enviado") + 1
                ws.update_cell(fila + 2, col_idx, "sí")
            return jsonify({"mensaje": "Correo enviado correctamente"}), 200

        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
    


@prereservas_bp.route('/<id_prereserva>', methods=['DELETE'])
@jwt_required()
@retry_on_rate_limit()
def eliminar_prereserva(id_prereserva):
    with pre_reserva_lock:
        identidad = get_jwt_identity()

        sheet = connect_sheet()
        ws_prereservas = sheet.worksheet("prereservas")
        ws_detalle = sheet.worksheet("detalle_prereserva")

        # Cargar datos
        prereservas = ws_prereservas.get_all_records()
        detalles = ws_detalle.get_all_records()

        # Buscar fila de la prereserva
        prereserva_idx = next(
            (i for i, r in enumerate(prereservas)
            if r["id_prereserva"] == id_prereserva and r["id_cliente"] == identidad),
            None
        )
        if prereserva_idx is None:
            return jsonify({"error": "Prereserva no encontrada o no autorizada"}), 404

        # Borrar fila en prereservas
        ws_prereservas.delete_rows(prereserva_idx + 2)

        # Borrar filas en detalle_prereserva
        filas_detalle = [i for i, d in enumerate(detalles) if d["id_prereserva"] == id_prereserva]
        # Importante: borrar en orden inverso para que los índices no se muevan
        for idx in sorted(filas_detalle, reverse=True):
            ws_detalle.delete_rows(idx + 2)

        return jsonify({"msg": "Prereserva eliminada"}), 200




@prereservas_bp.route('/<id_prereserva>', methods=['PUT'])
@jwt_required()
@retry_on_rate_limit()
def actualizar_prereserva(id_prereserva):
    with pre_reserva_lock:
        identidad = get_jwt_identity()
        data = request.get_json()
        fecha_inicio = data.get("fecha_inicio")
        fecha_fin = data.get("fecha_fin")

        if not fecha_inicio or not fecha_fin:
            return jsonify({"error": "Datos incompletos"}), 400
        
        sheet = connect_sheet()
        ws = sheet.worksheet("prereservas")
        prereservas = ws.get_all_records()

        # Buscar fila de la prereserva
        idx = next(
            (i for i, r in enumerate(prereservas)
            if r["id_prereserva"] == id_prereserva and r["id_cliente"] == identidad),
            None
        )
        if idx is None:
            return jsonify({"error": "Prereserva no encontrada o no autorizada"}), 404

        fila_nueva = [
            prereservas[idx]["id_prereserva"],
            prereservas[idx]["id_cliente"],
            fecha_inicio,
            fecha_fin,
            "pendiente",
            prereservas[idx]["fecha_creacion"]
        ]

        # Actualizar fila en Sheets (idx + 2 porque hay cabecera y enumeración inicia en 0)
        ws.update(f"A{idx+2}:F{idx+2}", [fila_nueva])

        return jsonify({"mensaje": "Prereserva actualizada"}), 200


@prereservas_bp.route('/detalle_prereserva/<id_prereserva>', methods=['PUT'])
@jwt_required()
@retry_on_rate_limit()
def actualizar_detalle_prereserva(id_prereserva):
    with detalle_pre_reserva_lock:
        identidad = get_jwt_identity()
        data = request.get_json()
        categoria = data.get("categoria")
        pantallas = data.get("pantallas", [])
        fecha_inicio = data.get("fecha_inicio")
        fecha_fin = data.get("fecha_fin")
        if fecha_inicio > fecha_fin:
            return jsonify({"error": "La fecha de fin debe ser posterior a la fecha de inicio"}), 400

        if not categoria or not pantallas:
            return jsonify({"error": "Datos incompletos"}), 400

        es_valido, error_msg = validar_detalle_prereserva(id_prereserva, pantallas, categoria, get_jwt_identity())
        if not es_valido:
            return jsonify({"error": error_msg}), 409
        
        sheet = connect_sheet()
        ws_prereservas = sheet.worksheet("prereservas")
        ws_detalle = sheet.worksheet("detalle_prereserva")

        prereservas = ws_prereservas.get_all_records()
        detalles = ws_detalle.get_all_records()

        # Validar que la prereserva exista y pertenezca al usuario
        prereserva = next(
            (r for r in prereservas if r["id_prereserva"] == id_prereserva and r["id_cliente"] == identidad),
            None
        )
        if not prereserva:
            return jsonify({"error": "Prereserva no encontrada o no autorizada"}), 404

        # Borrar filas existentes en detalle_prereserva
        filas_detalle = [i for i, d in enumerate(detalles) if d["id_prereserva"] == id_prereserva]
        for idx in sorted(filas_detalle, reverse=True):
            ws_detalle.delete_rows(idx + 2)

        # Insertar nuevas filas
        nuevas_filas = []
        for p in pantallas:
            fila = [
                uuid.uuid4().hex[:8],
                id_prereserva,
                p["id_pantalla"],
                categoria,
                p["cod_tarifas"]
            ]
            nuevas_filas.append(fila)

        ws_detalle.append_rows(nuevas_filas)

        return jsonify({"mensaje": "Detalle prereserva actualizado", "registros": len(nuevas_filas)}), 200
