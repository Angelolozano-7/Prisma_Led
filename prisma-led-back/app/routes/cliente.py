"""
Rutas relacionadas con la gestión y consulta de clientes en prisma-led-back.

Este módulo expone endpoints para:
- Actualizar los datos del cliente autenticado.
- Obtener los datos del cliente autenticado.

Características clave:
- Validaciones estrictas de formato para correo y NIT.
- Verificación de duplicados para evitar conflictos en la base de datos.
- Actualización eficiente en Google Sheets, tanto en la hoja de usuarios como de clientes.
- Uso de JWT para autenticación y protección de endpoints.
- Rate limiting para evitar abuso de los endpoints.

Futuro desarrollador:
- Puedes agregar endpoints para eliminar clientes, cambiar contraseña, o consultar historial.
- Si cambias la estructura de las hojas de Google Sheets, ajusta los mapeos de campos aquí.
- El manejo de errores y mensajes está centralizado para facilitar la internacionalización y mantenimiento.
"""

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sheets_client import (
    connect_sheet,
    get_usuarios,
    get_clientes
)
from app.extensions import limiter
import re

cliente_bp = Blueprint('cliente_bp', __name__)

@cliente_bp.route('/cliente', methods=['PUT'])
@jwt_required()
@limiter.limit("5 per minute")
def actualizar_cliente():
    """
    Actualiza los datos del cliente autenticado.

    - Realiza validaciones de formato para correo y NIT.
    - Verifica duplicados en correo y NIT para evitar conflictos.
    - Actualiza los datos en las hojas 'usuarios' y 'clientes' de Google Sheets.
    - Permite actualizar la contraseña si se proporciona.

    Request:
        JSON con los campos a actualizar:
        {
            "razon_social": str,
            "nit": str,
            "correo": str,
            "ciudad": str,
            "direccion": str,
            "telefono": str,
            "nombre_contacto": str,
            "password": str (opcional)
        }

    Response:
        200: { "msg": "Datos actualizados correctamente" }
        400: { "msg": "Correo inválido" / "El NIT debe contener solo números..." }
        404: { "msg": "Usuario no encontrado" }
        409: { "msg": "El correo ya está registrado" / "El NIT ya está registrado" }
    """
    id_usuario = get_jwt_identity()
    data = request.get_json()

    sheet = connect_sheet()
    usuarios_ws = sheet.worksheet("usuarios")
    clientes_ws = sheet.worksheet("clientes")

    usuarios = get_usuarios()
    clientes = get_clientes()

    usuario_index = next((i for i, u in enumerate(usuarios) if u["id_usuario"] == id_usuario), None)
    cliente_index = next((i for i, c in enumerate(clientes) if c["id_cliente"] == id_usuario), None)

    if usuario_index is None or cliente_index is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    # Validaciones de formato
    correo = data.get("correo", "").strip()
    nit = str(data.get("nit", "")).strip()

    if not re.match(r"[^@]+@[^@]+\.[^@]+", correo):
        return jsonify({"msg": "Correo inválido"}), 400

    if not re.match(r"^\d{9}-?\d{1}$", nit):
        return jsonify({"msg": "El NIT debe contener solo números y puede tener un '-' antes del último dígito"}), 400

    if len(nit.replace('-', '')) != 10:
        return jsonify({"msg": "El NIT debe tener 9 dígitos + el digito de verificación"}), 400

    # Validar duplicados
    if any(u["correo"].lower() == correo.lower() and u["id_usuario"] != id_usuario for u in usuarios):
        return jsonify({"msg": "El correo ya está registrado"}), 409

    if any(str(c["nit"]).strip() == nit and c["id_cliente"] != id_usuario for c in clientes):
        return jsonify({"msg": "El NIT ya está registrado"}), 409

    # Actualizar campos de usuarios
    campos_usuarios = {
        "nombre": data.get("razon_social", "").strip(),
        "correo": correo,
        "telefono": str(data.get("telefono", "")).strip(),
    }

    for campo, valor in campos_usuarios.items():
        if valor:
            col_idx = list(usuarios[0].keys()).index(campo) + 1
            usuarios_ws.update_cell(usuario_index + 2, col_idx, valor)

    if data.get("password"):
        password_hash = generate_password_hash(data["password"])
        col_idx = list(usuarios[0].keys()).index("password_hash") + 1
        usuarios_ws.update_cell(usuario_index + 2, col_idx, password_hash)

    # Actualizar campos de clientes
    campos_clientes = {
        "razon_social": "razon_social",
        "nit": "nit",
        "correo": "correo_electronico",
        "ciudad": "ciudad",
        "direccion": "direccion",
        "telefono": "telefono_contacto",
        "nombre_contacto": "nombre_contacto"
    }

    for key_front, key_sheet in campos_clientes.items():
        valor = str(data.get(key_front, "")).strip()
        if valor:
            if valor.isdigit():
                valor = f"'{valor}"
            col_idx = list(clientes[0].keys()).index(key_sheet) + 1
            clientes_ws.update_cell(cliente_index + 2, col_idx, valor)

    return jsonify({"msg": "Datos actualizados correctamente"}), 200

@cliente_bp.route('/cliente', methods=['GET'])
@jwt_required()
def obtener_cliente():
    """
    Obtiene los datos del cliente autenticado.

    - Retorna información relevante del cliente y usuario, como razón social, NIT,
      correo, ciudad, dirección, teléfono, nombre de contacto y usuario.

    Response:
        200: {
            "razon_social": str,
            "nit": str,
            "correo": str,
            "ciudad": str,
            "direccion": str,
            "telefono": str,
            "nombre_contacto": str,
            "usuario": str
        }
        404: { "msg": "Usuario no encontrado" }
    """
    id_usuario = get_jwt_identity()

    usuarios = get_usuarios()
    clientes = get_clientes()

    usuario = next((u for u in usuarios if u["id_usuario"] == id_usuario), None)
    cliente = next((c for c in clientes if c["id_cliente"] == id_usuario), None)

    if not usuario or not cliente:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    return jsonify({
        "razon_social": cliente.get("razon_social", ""),
        "nit": cliente.get("nit", ""),
        "correo": cliente.get("correo_electronico", ""),
        "ciudad": cliente.get("ciudad", ""),
        "direccion": cliente.get("direccion", ""),
        "telefono": cliente.get("telefono_contacto", ""),
        "nombre_contacto": cliente.get("nombre_contacto", ""),
        "usuario": usuario.get("correo", "")
    }), 200
