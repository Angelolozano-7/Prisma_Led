from flask import Blueprint, jsonify, request
from app.services.sheets_client import connect_sheet, get_categorias
import uuid
from flask_jwt_extended import jwt_required, get_jwt_identity

categorias_bp = Blueprint('categorias_bp', __name__)


@categorias_bp.route('/categorias', methods=['GET'])
def obtener_categorias():
    try:
        categorias = get_categorias()
        return jsonify(categorias), 200
    except Exception as e:
        return jsonify({'error': f'Error al obtener categorías: {str(e)}'}), 500


@categorias_bp.route('/categorias', methods=['POST'])
@jwt_required()
def agregar_categoria():
    try:
        data = request.get_json()
        nombre = data.get("nombre", "").strip()

        if not nombre:
            return jsonify({"error": "El campo 'nombre' es obligatorio"}), 400

        nuevo_id = uuid.uuid4().hex[:8]

        sheet = connect_sheet()
        cat_ws = sheet.worksheet("categorias")
        cat_ws.append_row([nuevo_id, nombre])

        return jsonify({"id_categoria": nuevo_id, "nombre": nombre}), 201
    except Exception as e:
        return jsonify({'error': f'Error al agregar categoría: {str(e)}'}), 500