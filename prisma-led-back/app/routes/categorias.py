"""
Endpoints de categorías de PrismaLED.

Permite consultar categorías y registrar nuevas categorías en la hoja
categorias de Google Sheets. Ambos endpoints requieren JWT.
"""


from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services.sheets_client import connect_sheet, get_categorias

categorias_bp = Blueprint('categorias_bp', __name__)


@categorias_bp.route('/categorias', methods=['GET'])
@jwt_required()
def obtener_categorias():
    """
    Endpoint para obtener todas las categorías.

    Requiere autenticación JWT.

    Returns:
        Response: JSON con la lista de categorías y código HTTP 200.
    """
    categorias = get_categorias()
    return jsonify(categorias), 200


@categorias_bp.route('/categorias', methods=['POST'])
@jwt_required()
def agregar_categoria():
    """
    Registra una nueva categoría en Google Sheets a partir del campo nombre.
    """
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict) or not isinstance(data.get("nombre"), str):
            return jsonify({"error": "El campo 'nombre' debe ser un texto"}), 400
        nombre = data["nombre"].strip()

        if not nombre:
            return jsonify({"error": "El campo 'nombre' es obligatorio"}), 400

        sheet = connect_sheet()
        cat_ws = sheet.worksheet("categorias")
        # Sheets y AppSheet usan nombre como única columna física y clave.
        categorias = cat_ws.get_all_records()
        if any(
            str(c.get("nombre", "")).strip().casefold() == nombre.casefold()
            for c in categorias
        ):
            return jsonify({"error": "La categoría ya existe"}), 409

        cat_ws.append_row([nombre])

        return jsonify({"nombre": nombre}), 201
    except Exception as e:
        return jsonify({'error': f'Error al agregar categoría: {str(e)}'}), 500
