from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sheets_client import connect_sheet
from datetime import datetime, timedelta
import pandas as pd
import uuid
from flask_mail import Message
from app import mail  # Asegúrate de que esté configurado
import traceback



def generar_id_appsheet():
    # AppSheet usa IDs estilo 'abc123de'. Podemos simularlo así:
    return uuid.uuid4().hex[:8]

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


@prereservas_bp.route('/crear', methods=['POST'])
@jwt_required()
def crear_prereserva():
    try:
        data = request.get_json()
        id_cliente = get_jwt_identity()

        fecha_inicio = data.get("fecha_inicio")
        fecha_fin = data.get("fecha_fin")  # ✅ ahora viene directamente del frontend
        categoria = data.get("categoria")

        if not (fecha_inicio and fecha_fin and categoria):
            return jsonify({"error": "Datos incompletos"}), 400

        # Generar ID y otros campos
        fecha_creacion = datetime.now().strftime("%Y-%m-%d")
        estado = "pendiente"
        id_prereserva = uuid.uuid4().hex[:8]

        # Guardar en Google Sheets
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
    try:
        data = request.get_json()
        id_prereserva = data.get("id_prereserva")
        pantallas = data.get("pantallas", [])
        categoria = data.get("categoria")

        if not id_prereserva or not pantallas or not categoria:
            return jsonify({"error": "Faltan datos requeridos"}), 400

        sheet = connect_sheet()
        detalle_ws = sheet.worksheet("detalle_prereserva")
        tarifas_ws = sheet.worksheet("tarifas") #eliminar doble cargar

        # Cargar tarifas
        tarifas = tarifas_ws.get_all_records()
        tarifa_map = {
            int(t["precio_semana"]): t["codigo_tarifa"]
            for t in tarifas
            if t.get("duracion_seg")
        }

        nuevas_filas = []

        for p in pantallas:
            precio_por_semana = int(p["precio"]) // int(data["duracion"])
            codigo_tarifa = tarifa_map.get(precio_por_semana)

            if not codigo_tarifa:
                return jsonify({"error": f"No se encontró código de tarifa para precio semanal: {precio_por_semana}"}), 400

            fila = [
                uuid.uuid4().hex[:8],  # id_detalle_prereserva
                id_prereserva,
                p["id_pantalla"],
                categoria,
                codigo_tarifa
            ]
            nuevas_filas.append(fila)

        detalle_ws.append_rows(nuevas_filas)
        return jsonify({"mensaje": "Detalle prereserva registrado", "registros": len(nuevas_filas)}), 201

    except Exception as e:
        return jsonify({"error": f"Error al guardar detalle: {str(e)}"}), 500



@prereservas_bp.route('/enviar-correo', methods=['POST'])
@jwt_required()
def enviar_correo_prereserva():
    try:
        data = request.get_json()
        id_cliente = get_jwt_identity()

        # Extraer datos
        correo = data.get('correo')
        razon_social = data.get('razon_social')
        nit = data.get('nit')
        id_prereserva = data.get('id_prereserva')
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        categoria = data.get('categoria')
        pantallas = data.get('pantallas')
        subtotal = data.get('subtotal')
        iva = data.get('iva')
        total = data.get('total')

        if not correo or not pantallas:
            return jsonify({"error": "Datos incompletos"}), 400

        # Construir mensaje HTML
        cuerpo_html = f"""
        <div style="font-family:Arial, sans-serif; color:#333;">
        <p>Buenas tardes,</p>

        <p>
            Le agradecemos por confiar en nosotros para que su marca llegue al corazón de Cali, el <strong>Bulevar del Río</strong>.
        </p>

        <p>
            A continuación encontrará los detalles de su <strong>pre-reserva #{id_prereserva.upper()}</strong>:
        </p>

        <hr style="border:none; border-top:1px solid #ccc; margin:16px 0;" />

        <h3 style="color:#7c3aed;">Prereserva #{id_prereserva.upper()}</h3>

        <p><strong>Razón Social:</strong> {razon_social}<br>
            <strong>NIT:</strong> {nit}<br>
            <strong>Correo:</strong> {correo}</p>

        <p><strong>Fecha:</strong> {fecha_inicio} - {fecha_fin}<br>
            <strong>Categoría:</strong> {categoria}</p>

        <ul>
            {''.join([f"<li>Pantalla {p['cilindro']}{p['identificador']} - {p['segundos'] // 20} semana{'s' if p['segundos'] // 20 > 1 else ''} - ${p['precio']:,}</li>" for p in pantallas])}
        </ul>

        <p><strong>Subtotal:</strong> ${subtotal:,}<br>
            <strong>IVA:</strong> ${iva:,}<br>
            <strong>Total:</strong> <strong>${total:,}</strong></p>

        <hr style="border:none; border-top:1px solid #ccc; margin:16px 0;" />

        <h4 style="margin-bottom: 6px;">Información adicional:</h4>
        <p>
            Su pre-reserva se encuentra en estado <strong>pendiente</strong>. Recuerde que tiene <strong>5 días</strong> para compartir el video de la campaña. Si este aún está en producción, puede compartir una imagen de referencia.
            <br><br>
            Posteriormente, el equipo técnico de Prisma Wall evaluará si el video cumple con las normativas de exposición al público de todas las edades y usted será notificado por este mismo medio.
        </p>
        </div>
        """

        msg = Message(
            subject=f"Confirmación de Prereserva #{id_prereserva.upper()} - PrismaLed",
            recipients=[correo],
            html=cuerpo_html
        )
        mail.send(msg)

        return jsonify({"mensaje": "Correo enviado correctamente"}), 200

    except Exception as e:
        traceback.print_exc()  # ⬅️ imprime el error exacto en consola
        return jsonify({"error": str(e)}), 500