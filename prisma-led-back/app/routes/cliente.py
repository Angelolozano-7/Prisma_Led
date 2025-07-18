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
