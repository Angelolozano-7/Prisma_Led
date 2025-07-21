"""
Rutas relacionadas con la gestión de ciudades en prisma-led-back.

Incluye endpoints para listar y registrar ciudades, con validaciones de nombre y control de concurrencia.
"""

from flask import Blueprint, jsonify, request
from app.services.sheets_client import get_ciudades, add_ciudad
from flask_jwt_extended import jwt_required
from app.extensions import limiter
from app.extensions import ciudad_lock

ciudad_bp = Blueprint('ciudad_bp', __name__)

@ciudad_bp.route('', methods=['GET'])
@limiter.limit("10 per minute")
def listar_ciudades():
    """
    Endpoint para listar todas las ciudades registradas.

    Returns:
        Response: JSON con la lista de nombres de ciudades y código HTTP 200.
    """
    ciudades = get_ciudades()
    return jsonify([c["nombre_ciudad"] for c in ciudades]), 200

@ciudad_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("3 per minute")
def registrar_ciudad():
    """
    Endpoint para registrar una nueva ciudad.

    Realiza validaciones de nombre y controla concurrencia con un lock.

    Returns:
        Response: JSON con mensaje de éxito o error.
    """
    with ciudad_lock:
        data = request.get_json()
        nombre = data.get("nombre", "").strip().title()

        if not nombre:
            return jsonify({"msg": "Nombre de ciudad requerido"}), 400

        if len(nombre) < 3 or len(nombre) > 50:
            return jsonify({"msg": "El nombre debe tener entre 3 y 50 caracteres"}), 400

        if add_ciudad(nombre):
            return jsonify({"msg": "Ciudad registrada"}), 201
        else:
            return jsonify({"msg": "La ciudad ya existe"}), 200
