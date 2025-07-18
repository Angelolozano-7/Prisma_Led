from flask import Blueprint, jsonify, request
from app.services.sheets_client import get_ciudades, add_ciudad
from flask_jwt_extended import jwt_required
from app.extensions import limiter

ciudad_bp = Blueprint('ciudad_bp', __name__)

@ciudad_bp.route('', methods=['GET'])
@jwt_required()
def listar_ciudades():
    ciudades = get_ciudades()
    return jsonify([c["nombre_ciudad"] for c in ciudades]), 200

@ciudad_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("3 per minute")
def registrar_ciudad():
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
