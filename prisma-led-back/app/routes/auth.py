from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from app.services.sheets_client import connect_sheet
from werkzeug.security import generate_password_hash
from datetime import datetime

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    correo = data.get("correo")
    password = data.get("password")

    sheet = connect_sheet().worksheet("usuarios")
    users = sheet.get_all_records()

    user = next((u for u in users if u["correo"] == correo), None)

    if user and check_password_hash(user["password_hash"], password):
        access_token = create_access_token(identity={
            "id": user["id_usuario"],
            "nombre": user["nombre"],
            "correo": user["correo"],
            "rol": user["rol"]
        })
        return jsonify({"access_token": access_token}), 200

    return jsonify({"msg": "Credenciales inválidas"}), 401



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

    id_usuario = len(usuarios) + 1
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
        clientes = sheet_clientes.get_all_records()
        id_cliente = len(clientes) + 1

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
    