from flask import Blueprint, jsonify, request
from app.services.sheets_client import get_ciudades, add_ciudad
from flask_jwt_extended import jwt_required

ciudad_bp = Blueprint('ciudad_bp', __name__)

@ciudad_bp.route('', methods=['GET'])
def listar_ciudades():
    ciudades = get_ciudades()
    return jsonify([c["nombre_ciudad"] for c in ciudades]), 200

@ciudad_bp.route('', methods=['POST'])
@jwt_required()
def registrar_ciudad():
    data = request.get_json()
    nombre = data.get("nombre")

    if not nombre:
        return jsonify({"msg": "Nombre de ciudad requerido"}), 400

    if add_ciudad(nombre):
        return jsonify({"msg": "Ciudad registrada"}), 201
    else:
        return jsonify({"msg": "La ciudad ya existe"}), 200
