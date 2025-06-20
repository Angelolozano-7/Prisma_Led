from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from app.services.sheets_client import connect_sheet
from flask_jwt_extended import jwt_required, get_jwt_identity

cliente_bp = Blueprint('cliente_bp', __name__)

@cliente_bp.route('/cliente', methods=['PUT'])
@jwt_required()
def actualizar_cliente():
    id_usuario = get_jwt_identity()

    data = request.get_json()
    sheet = connect_sheet()
    usuarios_ws = sheet.worksheet("usuarios")
    clientes_ws = sheet.worksheet("clientes")

    usuarios = usuarios_ws.get_all_records()
    clientes = clientes_ws.get_all_records()

    # Buscar índices por ID en ambas hojas
    usuario_index = next((i for i, u in enumerate(usuarios) if u["id_usuario"] == id_usuario), None)
    cliente_index = next((i for i, c in enumerate(clientes) if c["id_cliente"] == id_usuario), None)

    if usuario_index is None or cliente_index is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    # Columnas usuarios
    campos_usuarios = {
        "nombre": data.get("razon_social"),
        "correo": data.get("correo"),
        "telefono": data.get("telefono"),
    }

    for campo, valor in campos_usuarios.items():
        if valor:
            col_idx = list(usuarios[0].keys()).index(campo) + 1
            usuarios_ws.update_cell(usuario_index + 2, col_idx, valor)

    if data.get("password"):
        password_hash = generate_password_hash(data["password"])
        col_idx = list(usuarios[0].keys()).index("password_hash") + 1
        usuarios_ws.update_cell(usuario_index + 2, col_idx, password_hash)

    # Columnas clientes
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
        if data.get(key_front):
            col_idx = list(clientes[0].keys()).index(key_sheet) + 1
            clientes_ws.update_cell(cliente_index + 2, col_idx, data[key_front])

    return jsonify({"msg": "Datos actualizados correctamente"}), 200


@cliente_bp.route('/cliente', methods=['GET'])
@jwt_required()
def obtener_cliente():
    from flask import request
    print(request.headers)
    id_usuario = get_jwt_identity()

    sheet = connect_sheet()
    usuarios = sheet.worksheet("usuarios").get_all_records()
    clientes = sheet.worksheet("clientes").get_all_records()

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
