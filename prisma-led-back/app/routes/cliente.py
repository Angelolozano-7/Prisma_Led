from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from app.services.sheets_client import connect_sheet
from flask_jwt_extended import jwt_required, get_jwt_identity

cliente_bp = Blueprint('cliente_bp', __name__)

@cliente_bp.route('/cliente/<id_usuario>', methods=['PUT'])
def actualizar_cliente(id_usuario):
    data = request.get_json()

    sheet = connect_sheet()
    usuarios_ws = sheet.worksheet("usuarios")
    clientes_ws = sheet.worksheet("clientes")

    usuarios = usuarios_ws.get_all_records()
    clientes = clientes_ws.get_all_records()

    # Buscar índice de usuario y cliente
    usuario_index = next((i for i, u in enumerate(usuarios) if u["id_usuario"] == id_usuario), None)
    cliente_index = next((i for i, c in enumerate(clientes) if c["correo_electronico"] == data["correo"]), None)

    if usuario_index is None or cliente_index is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    # Actualizar hoja de usuarios (fila real = índice + 2)
    usuarios_ws.update_cell(usuario_index + 2, 2, data["nombre_contacto"])  # nombre
    usuarios_ws.update_cell(usuario_index + 2, 3, data["correo"])           # correo
    usuarios_ws.update_cell(usuario_index + 2, 4, data["telefono"])         # telefono

    if "password" in data and data["password"]:
        hashed = generate_password_hash(data["password"])
        usuarios_ws.update_cell(usuario_index + 2, 6, hashed)  # password_hash (columna 6)

    # Actualizar hoja de clientes
    clientes_ws.update_cell(cliente_index + 2, 2, data["razon_social"])
    clientes_ws.update_cell(cliente_index + 2, 3, data["nit"])
    clientes_ws.update_cell(cliente_index + 2, 4, data["correo"])
    clientes_ws.update_cell(cliente_index + 2, 5, data["ciudad"])
    clientes_ws.update_cell(cliente_index + 2, 6, data["direccion"])
    clientes_ws.update_cell(cliente_index + 2, 7, data["telefono"])
    clientes_ws.update_cell(cliente_index + 2, 8, data["nombre_contacto"])

    return jsonify({"msg": "Datos actualizados correctamente"}), 200


@cliente_bp.route('/auth/usuario/<id_usuario>', methods=['GET', 'OPTIONS'])
def obtener_usuario(id_usuario):
    if request.method == 'OPTIONS':
        return '', 200  # respuesta al preflight CORS

    sheet = connect_sheet()
    usuarios_ws = sheet.worksheet("usuarios")
    clientes_ws = sheet.worksheet("clientes")

    usuarios = usuarios_ws.get_all_records()
    clientes = clientes_ws.get_all_records()

    # Buscar usuario
    usuario = next((u for u in usuarios if u["id_usuario"] == id_usuario), None)
    if not usuario:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    # Buscar cliente con el mismo correo
    cliente = next((c for c in clientes if c["correo_electronico"] == usuario["correo"]), {})

    # Unificar respuesta
    data = {
        "nombre": usuario["nombre"],
        "correo": usuario["correo"],
        "telefono": usuario["telefono"],
        "razon_social": cliente.get("razon_social", ""),
        "nit": cliente.get("nit", ""),
        "ciudad": cliente.get("ciudad", ""),
        "direccion": cliente.get("direccion", ""),
        "nombre_contacto": cliente.get("nombre_contacto", "")
    }

    return jsonify(data), 200