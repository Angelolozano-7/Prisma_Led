"""
Rutas de autenticación para prisma-led-back.

Este módulo define los endpoints relacionados con la autenticación y gestión de usuarios:
- Login: Verifica credenciales y retorna un JWT.
- Registro: Permite crear nuevos usuarios y clientes, validando duplicados.
- Recuperación: Envía una contraseña temporal al correo del usuario.

Características clave:
- Seguridad: Uso de JWT para autenticación y werkzeug para hash de contraseñas.
- Integración: Los datos se almacenan en Google Sheets mediante los servicios definidos.
- Concurrencia: Locks para evitar condiciones de carrera en registro y recuperación.
- Email: Envío de correos de recuperación usando Flask-Mail.
- Rate limiting: Protección contra abuso con Flask-Limiter.

Futuro desarrollador:
- Puedes agregar endpoints para cambio de contraseña, verificación de correo, o integración con OAuth.
- Si cambias el almacenamiento de usuarios, ajusta los servicios y validaciones aquí.
- El manejo de errores y mensajes está centralizado para facilitar la internacionalización.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from app.services.sheets_client import (
    connect_sheet,
    get_usuarios,
    get_clientes
)
from datetime import datetime
from app.services.id_user_generator import generate_unique_user_id
from app.services.uxid import generate_next_uxid
from app.extensions import mail
from app.extensions import registro_lock
from app.extensions import recovery_lock
import random
import traceback
import string
from app.extensions import limiter

import uuid

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route("/login", methods=["POST"])
@limiter.limit("50 per minute")
def login():
    """
    Autenticación de usuario.

    Recibe correo y contraseña, valida contra la base de usuarios y retorna un JWT si son correctos.

    Request:
        JSON: { "correo": str, "password": str }

    Response:
        200: { "token": str, "usuario": str, "correo": str }
        401: { "msg": "Credenciales inválidas" }
    """
    data = request.get_json()
    correo = data.get("correo", "").strip()
    password = data.get("password", "")

    usuarios = get_usuarios()
    usuario = next((u for u in usuarios if u["correo"].lower() == correo.lower()), None)

    if not usuario or not check_password_hash(usuario.get("password_hash", ""), password):
        return jsonify({"msg": "Credenciales inválidas"}), 401

    access_token = create_access_token(identity=usuario["id_usuario"])
    return jsonify({
        "token": access_token,
        "usuario": usuario["id_usuario"],
        "correo": usuario["correo"]
    }), 200


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("50 per minute")
def register():
    """
    Registro de nuevo usuario y cliente.

    Valida los datos recibidos, verifica duplicados por correo y NIT, y guarda el usuario y cliente en Google Sheets.

    Request:
        JSON: {
            "nombre_contacto": str,
            "correo": str,
            "telefono": str,
            "password": str,
            "rol": str (opcional, default "cliente"),
            "creado_por": str (opcional),
            "razon_social": str,
            "nit": str,
            "ciudad": str,
            "direccion": str
        }

    Response:
        201: { "msg": "Registro exitoso" }
        400: { "msg": "Faltan campos obligatorios" }
        409: { "msg": "El correo ya está registrado" / "El nit ya está registrado" }
    """
    with registro_lock:
        data = request.get_json()

        nombre = data.get("nombre_contacto")
        correo = data.get("correo")
        telefono = data.get("telefono")
        password = data.get("password")
        rol = data.get("rol", "cliente")
        creado_por = data.get("creado_por", "registro_web")

        razon_social = data.get("razon_social")
        nit = data.get("nit")
        ciudad = data.get("ciudad")
        direccion = data.get("direccion")
        nombre_contacto = data.get("nombre_contacto")

        if not nombre or not correo or not password:
            return jsonify({"msg": "Faltan campos obligatorios"}), 400

        usuarios = get_usuarios()
        if any(u["correo"] == correo for u in usuarios):
            return jsonify({"msg": "El correo ya está registrado"}), 409
        clientes = get_clientes()
        if any(str(u["nit"]) == str(nit) for u in clientes):
            return jsonify({"msg": "El nit ya está registrado"}), 409

        id_usuario = generate_unique_user_id()
        uxid = generate_next_uxid("usuarios")
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
            creado_por,
            uxid
        ]

        sheet = connect_sheet()
        sheet_usuarios = sheet.worksheet("usuarios")
        sheet_usuarios.append_row(nueva_fila_usuario)

        if rol == "cliente":
            sheet_clientes = sheet.worksheet("clientes")
            id_cliente = id_usuario
            uxid_cliente = generate_next_uxid("clientes")

            nueva_fila_cliente = [
                id_cliente,
                razon_social,
                nit,
                correo,
                ciudad,
                direccion,
                telefono,
                nombre_contacto,
                uxid_cliente

            ]
            sheet_clientes.append_row(nueva_fila_cliente)

        return jsonify({"msg": "Registro exitoso"}), 201


@auth_bp.route("/recovery", methods=["POST"])
@limiter.limit("3 per hour")
def recovery():
    """
    Recuperación de contraseña.

    Genera una contraseña temporal y la envía al correo del usuario registrado.
    Actualiza la contraseña en la base de datos y protege el endpoint con un lock y rate limit.

    Request:
        JSON: { "correo": str }

    Response:
        200: { "msg": "Contraseña temporal enviada", "correo_visible": str }
        400: { "msg": "Correo requerido" }
        404: { "msg": "Correo no registrado" }
        500: { "msg": "Error al enviar el correo", "error": str }
    """
    with recovery_lock:
        data = request.get_json()
        correo = data.get("correo")

        if not correo:
            return jsonify({"msg": "Correo requerido"}), 400

        users = get_usuarios()
        index = next((i for i, u in enumerate(users) if u["correo"] == correo), None)
        if index is None:
            return jsonify({"msg": "Correo no registrado"}), 404

        temporal_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        hashed_password = generate_password_hash(temporal_password)

        row_to_update = index + 2
        sheet = connect_sheet().worksheet("usuarios")
        sheet.update_cell(row_to_update, 6, hashed_password)

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
    comercial@prismaled.com
    """
        try:
            mail.send(msg)
            return jsonify({
                "msg": "Contraseña temporal enviada",
                "correo_visible": correo[:4] + "***"
            }), 200
        except Exception as e:
            return jsonify({"msg": "Error al enviar el correo", "error": str(e)}), 500


@auth_bp.route("/refresh-token", methods=["POST"])
@jwt_required()
@limiter.limit("20 per minute")
def refresh_token():
    """
    Renueva el token JWT antes de su expiración.

    Requiere que el token actual sea válido (no expirado) para emitir uno nuevo.

    Response:
        200: { "token": str }
        401: { "msg": "Token inválido o expirado" }
    """
    current_user = get_jwt_identity()
    new_token = create_access_token(identity=current_user)
    return jsonify({"token": new_token}), 200
