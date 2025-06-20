from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token
from app.services.sheets_client import connect_sheet
from datetime import datetime
from app.services.id_user_generator import generate_unique_user_id, generate_unique_client_id
from app.extensions import mail
import random
import string


auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    correo = data.get("correo")
    password = data.get("password")

    sheet = connect_sheet().worksheet("usuarios")
    users = sheet.get_all_records()

    user = next((u for u in users if u["correo"] == correo), None)

    if not user:
        return jsonify({"msg": "Correo no registrado"}), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({"msg": "Contraseña incorrecta"}), 401

    access_token = create_access_token(identity= user["id_usuario"])
    return jsonify({"access_token": access_token}), 200



@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    nombre = data.get("nombre")
    correo = data.get("correo")
    telefono = data.get("telefono")
    password = data.get("password")
    rol = data.get("rol", "cliente")
    creado_por = data.get("creado_por", "registro_web")

    # Campos del cliente
    razon_social = data.get("razon_social")
    nit = data.get("nit")
    ciudad = data.get("ciudad")
    direccion = data.get("direccion")
    nombre_contacto = data.get("nombre_contacto")

    if not nombre or not correo or not password:
        return jsonify({"msg": "Faltan campos obligatorios"}), 400

    sheet = connect_sheet()
    sheet_usuarios = sheet.worksheet("usuarios")
    usuarios = sheet_usuarios.get_all_records()

    if any(u["correo"] == correo for u in usuarios):
        return jsonify({"msg": "El correo ya está registrado"}), 409

    id_usuario = generate_unique_user_id()
    fecha_creacion = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    password_hash = generate_password_hash(password)

    nueva_fila_usuario = [
        id_usuario,
        nombre,
        correo,
        telefono,
        rol,
        password_hash,
        fecha_creacion,
        creado_por
    ]

    sheet_usuarios.append_row(nueva_fila_usuario)

    if rol == "cliente":
        sheet_clientes = sheet.worksheet("clientes")
        #clientes = sheet_clientes.get_all_records()
        id_cliente = id_usuario  # Usar el mismo ID para cliente

        nueva_fila_cliente = [
            id_cliente,
            razon_social,
            nit,
            correo,
            ciudad,
            direccion,
            telefono,
            nombre_contacto
        ]

        sheet_clientes.append_row(nueva_fila_cliente)

    return jsonify({"msg": "Registro exitoso"}), 201
    


@auth_bp.route("/recovery", methods=["POST"])
def recovery():
    data = request.get_json()
    correo = data.get("correo")

    if not correo:
        return jsonify({"msg": "Correo requerido"}), 400

    sheet = connect_sheet().worksheet("usuarios")
    users = sheet.get_all_records()

    index = next((i for i, u in enumerate(users) if u["correo"] == correo), None)
    if index is None:
        return jsonify({"msg": "Correo no registrado"}), 404

    # Generar contraseña temporal segura
    temporal_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    hashed_password = generate_password_hash(temporal_password)

    # Actualizar hoja (fila real = índice + 2, columna 6 = password_hash)
    row_to_update = index + 2
    sheet.update_cell(row_to_update, 6, hashed_password)

    # Enviar correo profesional
    sender = current_app.config["MAIL_USERNAME"]
    msg = Message("Recuperación de Contraseña - PrismaLED", sender=sender, recipients=[correo])
    msg.body = f"""Hola,

    Hemos recibido una solicitud para recuperar el acceso a tu cuenta de PrismaLED.

    Esta es tu nueva contraseña temporal:
    🔐 {temporal_password}

    Te recomendamos cambiarla una vez hayas ingresado, para mayor seguridad.

    Gracias por ser parte de PrismaLED, el sistema exclusivo de pantallas publicitarias en el Bulevar del Río.

    Atentamente,
    Equipo PrismaLED
    https://prismaled.com
    """
    try:
        mail.send(msg)
        return jsonify({
            "msg": "Contraseña temporal enviada",
            "correo_visible": correo[:4] + "***"
        }), 200
    except Exception as e:
        return jsonify({"msg": "Error al enviar el correo", "error": str(e)}), 500