"""
Endpoints del flujo de reservas del cliente.

Nomenclatura legacy: la reserva funcional actual se almacena internamente
en prereservas y detalle_prereserva. Estos nombres se conservan para no
romper compatibilidad con backend y Google Sheets.

El módulo consulta, crea, edita y elimina reservas, gestiona su detalle,
genera UXID y envía el correo de confirmación.
"""


from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import pandas as pd
import uuid
from flask_mail import Message
from app import mail
import traceback
from app.services.retry_utils import retry_on_rate_limit
from app.services.validadores import validar_detalle_prereserva
from app.services.uxid import generate_next_uxid
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
    """
    Genera un identificador único de 8 caracteres hexadecimales para AppSheet.
    """
    return uuid.uuid4().hex[:8]

def obtener_tarifa(segundos, tarifas):
    return tarifas.get(segundos, 0)


@prereservas_bp.route('/cliente', methods=['GET', 'OPTIONS'])
@jwt_required()
def obtener_reservas_del_cliente():
    """
    Obtiene todas las prereservas del cliente autenticado.

    Returns:
        200: Lista de prereservas del cliente.
    """
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
    """
    Obtiene el detalle de una prereserva específica del cliente autenticado.

    Args:
        id_reserva (str): ID de la prereserva.

    Returns:
        200: Detalles de pantallas y tarifas asociadas.
        404: Si la prereserva no existe o no pertenece al usuario.
    """
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
                "precio": precio
            })

    return jsonify({
        "id_reserva": reserva["id_prereserva"],
        "fecha_creacion": reserva["fecha_creacion"],
        "fecha_inicio": reserva["fecha_inicio"],
        "duracion": (
            (pd.to_datetime(reserva["fecha_fin"]) - pd.to_datetime(reserva["fecha_inicio"])).days // 7
        ),
        "categoria": detalles[0]["categoria"] if detalles else "",
        "pantallas": pantallas_resultado,
        "uxid": reserva.get("uxid", None)
    }), 200

@prereservas_bp.route('/enviar-correo', methods=['POST'])
@jwt_required()
def enviar_correo_prereserva():
    """
    Envía el correo de confirmación de prereserva al cliente.

    - Construye el cuerpo HTML con los detalles de la prereserva.
    - Actualiza el estado 'correo_enviado' en la hoja de prereservas.
    - Protege contra reenvío duplicado.

    Returns:
        200: Mensaje de éxito.
        409: Si el correo ya fue enviado.
        400: Si faltan datos.
        500: Si ocurre un error al enviar el correo.
    """
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
            uxid = data.get('uxid')
            pantallas = data.get('pantallas')
            subtotal = data.get('subtotal')
            iva = data.get('iva')
            total = data.get('total')
            duracion = data.get('duracion')
            resumen = data.get('resumen')
            tarifas = get_tarifas()
            tarifas = {t['duracion_seg']: t['precio_semana'] for t in tarifas}
            precio_dic = 2000000
            semanasFueraDic = resumen.get('semanasFueraDic', 0)
            semanasDic = resumen.get('semanasDic', 0)
            semanas = duracion
            

            if not correo or not pantallas:
                return jsonify({"error": "Datos incompletos"}), 400

            # Construcción del HTML por pantalla
            pantalla_html = []
            ahorroTotal = 0
            for p in pantallas:
                base = int(p['base'])
                precio = int(p['precio'])
                segundos = p.get('segundos', 0)
                cupos = segundos// 20  # Cada cupo es de 20 segundos
                #tengo los segundos de cada pantalla y tengo el diccionario de tarifas, ahora vamos a obtener la tarifa
                tarifa = obtener_tarifa(segundos, tarifas)
                subtotal_pantalla = (semanasFueraDic * tarifa) + (semanasDic * precio_dic * cupos)
                descuento = p.get('descuento', 0)
                ahorro = (semanasFueraDic * tarifa) * descuento
                pdescuento = ahorro/subtotal_pantalla
                ahorroTotal += ahorro
                

                linea = f"""
                <li style="margin-bottom: 12px;">
                    <strong>Pantalla {p['cilindro']}{p['identificador']}</strong> - {semanas} semana{'s' if semanas > 1 else ''} - cupos {cupos}<br/>
                    Valor por semana normal: ${tarifa:,.0f}<br/>
                    Valor por semana de diciembre: ${precio_dic * cupos:,.0f}<br/>
                    <strong>Subtotal sin descuento:</strong> ${subtotal_pantalla:,.0f}<br/>
                """

                if descuento > 0:
                    linea += f"""
                    <div style='color:#dc2626; font-size:13px;'>
                        Descuento aplicado:${ahorro:,.0f} (-{pdescuento * 100:.0f}%)<br/>
                    </div>
                    <strong>Total con descuento:</strong> ${precio:,.0f}<br/>
                    """
                linea += "</li>"
                pantalla_html.append(linea)

            pantallas_html = "<ul>" + "".join(pantalla_html) + "</ul>"

            # Cuerpo del mensaje HTML
            cuerpo_html = f"""
                <div style="font-family:Arial, sans-serif; color:#333; font-size:15px; line-height:1.6;">
                    <p>Buenas tardes,</p>

                    <p>Le agradecemos por confiar en nosotros para que su marca llegue al corazón de Cali, el <strong>Bulevar del Río</strong>.</p>

                    <p>A continuación encontrará los detalles de su <strong style="color:#3B82F6;">reserva PW-{uxid}</strong>:</p>
                    
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
                        <strong>Subtotal base:</strong> ${subtotal + ahorroTotal:,.0f}
                        <div style='color:#dc2626; font-size:13px;'>
                        Descuento aplicado:$ {ahorroTotal:,.0f}<br/>
                        </div>
                        <strong>Subtotal con descuento:</strong> ${subtotal:,.0f}<br/>
                        <strong>IVA (19%):</strong> ${iva:,.0f}<br/>
                        <strong style="font-size: 16px;">Total:</strong> <span style="font-size: 16px; font-weight: bold;">${total:,.0f}</span>
                    </p>

                    <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;" />

                    <p style="font-size:14px;"><strong>Información adicional:</strong></p>
                    <p style="font-size:14px;">
                        Su reserva se encuentra en estado <strong style="color:#dc2626;">pendiente</strong>.
                        Recuerde que tiene <strong>5 días</strong> para compartir el video de la campaña. Si este aún está en producción, puede compartir una imagen de referencia.
                    </p>

                    <p style="font-size:14px;">
                        Posteriormente, el equipo técnico de <strong>Prisma Wall</strong> evaluará si el video cumple con las normativas de exposición al público de todas las edades y usted será notificado por este mismo medio.
                    </p>
                    <p style="font-size:14px;">
                        Muchas gracias por elegirnos.<br/>
                        Atentamente,<br/>
                        Andres Lozano<br/>
                        Gerente Comercial - Prisma Wall<br/>
                        +573007053297
                    </p>
                </div>
                """


            # Envío del correo
            msg = Message(
                subject=f" Confirmación de reserva PW-{uxid} - Prisma Wall",
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
    """
    Elimina una prereserva y sus detalles.

    Args:
        id_prereserva (str): ID de la prereserva a eliminar.

    Returns:
        200: Mensaje de éxito.
        404: Si la prereserva no existe o no pertenece al usuario.
    """
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

@prereservas_bp.route('/crear-completo', methods=['POST'])
@jwt_required()
def crear_prereserva_completa():
    """
    Crea una prereserva y su detalle en una sola operación.

    Returns:
        201: Mensaje de éxito y el ID de la prereserva creada.
        400: Si faltan datos requeridos.
        500: Si ocurre un error y se realiza rollback.
    """
    with pre_reserva_lock:
        try:
            data = request.get_json()
            id_cliente = get_jwt_identity()

            fecha_inicio = data.get("fecha_inicio")
            fecha_fin = data.get("fecha_fin")
            categoria = data.get("categoria")
            pantallas = data.get("pantallas", [])
            
            if not (fecha_inicio and fecha_fin and categoria and pantallas):
                return jsonify({"error": "Faltan datos requeridos"}), 400

            id_prereserva = uuid.uuid4().hex[:8]
            uxid = generate_next_uxid("prereservas")
            fecha_creacion = datetime.now().strftime("%Y-%m-%d")

            sheet = connect_sheet()
            ws_prereservas = sheet.worksheet("prereservas")
            ws_detalle = sheet.worksheet("detalle_prereserva")

            # 2. Escribir detalle primero
            nuevas_filas = []
            nextid= generate_next_uxid("detalle_prereserva") 
            for p in pantallas:
                fila = [
                    uuid.uuid4().hex[:8],
                    id_prereserva,
                    p["id_pantalla"],
                    categoria,
                    p["cod_tarifas"],
                    nextid
                ]
                nextid += 1
                nuevas_filas.append(fila)
            ws_detalle.append_rows(nuevas_filas)

            # 3. Escribir prereserva
            ws_prereservas.append_row([
                id_prereserva,
                id_cliente,
                fecha_inicio,
                fecha_fin,
                "pendiente",
                fecha_creacion,
                "no",  # correo_enviado
                uxid
            ])

            return jsonify({
                "msg": "Prereserva creada con éxito",
                "id_prereserva": id_prereserva,
                "uxid": uxid
            }), 201

        except Exception as e:
            traceback.print_exc()

            # Rollback completo: elimina tanto la cabecera como cualquier
            # detalle que haya alcanzado a escribirse antes del error.
            try:
                sheet = connect_sheet()
                ws_prereservas = sheet.worksheet("prereservas")
                ws_detalle = sheet.worksheet("detalle_prereserva")

                prereservas = ws_prereservas.get_all_records()
                fila = next(
                    (i for i, r in enumerate(prereservas)
                     if r["id_prereserva"] == id_prereserva),
                    None
                )
                if fila is not None:
                    ws_prereservas.delete_rows(fila + 2)

                detalles = ws_detalle.get_all_records()
                filas_detalle = [
                    i for i, d in enumerate(detalles)
                    if d["id_prereserva"] == id_prereserva
                ]
                for idx in sorted(filas_detalle, reverse=True):
                    ws_detalle.delete_rows(idx + 2)

            except Exception as rollback_error:
                current_app.logger.error(
                    "Error durante rollback de creación de reserva: %s",
                    rollback_error
                )

            return jsonify({"error": f"Error al crear prereserva completa: {str(e)}"}), 500

@prereservas_bp.route('/actualizar-completo/<id_prereserva>', methods=['PUT'])
@jwt_required()
def actualizar_prereserva_completa(id_prereserva):
    """
    Actualiza una prereserva y su detalle en una sola operación.

    Args:
        id_prereserva (str): ID de la prereserva a actualizar.

    Returns:
        200: Mensaje de éxito y el ID de la prereserva actualizada.
        400: Si faltan datos requeridos.
        404: Si la prereserva no existe o no pertenece al usuario.
        409: Si la validación de detalle falla.
        500: Si ocurre un error inesperado.
    """
    with pre_reserva_lock, detalle_pre_reserva_lock:
        try:
            identidad = get_jwt_identity()
            data = request.get_json()

            fecha_inicio = data.get("fecha_inicio")
            fecha_fin = data.get("fecha_fin")
            categoria = data.get("categoria")
            uxid = data.get("uxid")
            pantallas = data.get("pantallas", [])

            if not (fecha_inicio and fecha_fin and categoria and pantallas):
                return jsonify({"error": "Faltan datos requeridos"}), 400

            sheet = connect_sheet()
            ws_prereservas = sheet.worksheet("prereservas")
            ws_detalle = sheet.worksheet("detalle_prereserva")

            # Verifica que la prereserva exista y sea del usuario autenticado
            prereservas = ws_prereservas.get_all_records()
            idx = next(
                (i for i, r in enumerate(prereservas)
                 if r["id_prereserva"] == id_prereserva and r["id_cliente"] == identidad),
                None
            )
            if idx is None:
                return jsonify({"error": "Prereserva no encontrada o no autorizada"}), 404

            # Validar las pantallas con el validador si es necesario
            from app.services.validadores import validar_detalle_prereserva
            es_valido, error_msg = validar_detalle_prereserva(
                id_prereserva,
                pantallas,
                categoria,
                identidad,
                fecha_inicio_nueva=fecha_inicio,
                fecha_fin_nueva=fecha_fin
            )
            if not es_valido:
                return jsonify({"error": error_msg}), 409

            # 1. Actualizar prereserva
            fila_actual = prereservas[idx]
            fila_nueva = [
                id_prereserva,
                identidad,
                fecha_inicio,
                fecha_fin,
                "pendiente",
                fila_actual.get("fecha_creacion", datetime.now().strftime("%Y-%m-%d")),
                "no",
                uxid
            ]
            ws_prereservas.update(f"A{idx+2}:H{idx+2}", [fila_nueva])

            # 2. Eliminar filas anteriores de detalle
            detalles = ws_detalle.get_all_records()
            filas_detalle = [i for i, d in enumerate(detalles) if d["id_prereserva"] == id_prereserva]
            for i in sorted(filas_detalle, reverse=True):
                ws_detalle.delete_rows(i + 2)

            # 3. Insertar nuevas filas
            nuevas_filas = []
            nextid= generate_next_uxid("detalle_prereserva")
            for p in pantallas:
                nuevas_filas.append([
                    uuid.uuid4().hex[:8],
                    id_prereserva,
                    p["id_pantalla"],
                    categoria,
                    p["cod_tarifas"],
                    nextid
                ])
                nextid += 1
            ws_detalle.append_rows(nuevas_filas)

            return jsonify({
                "msg": "Prereserva actualizada con éxito",
                "id_prereserva": id_prereserva,
                "uxid": uxid
            }), 200

        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": f"Error al actualizar prereserva completa: {str(e)}"}), 500
