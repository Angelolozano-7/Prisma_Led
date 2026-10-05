"""
Application factory del backend de PrismaLED.

Centraliza la creación y configuración de Flask: carga Config, inicializa
Flask-Mail, CORS, JWT y Flask-Limiter, registra los blueprints de la API y
define la respuesta estándar para errores HTTP 429.
"""


from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from flask_jwt_extended import JWTManager
from .extensions import mail
from app.routes.cliente import cliente_bp
from app.routes.reservas import reservas_bp
from app.routes.auth import auth_bp
from app.routes.prereservas import prereservas_bp
from app.routes.categorias import categorias_bp
from app.routes.tarifas import tarifas_bp
from app.routes.pantallas import pantallas_bp
import os
from app.routes.ciudad import ciudad_bp
from app.extensions import limiter

def create_app():
    """
    Crea y configura una instancia de la aplicación Flask de PrismaLED.

    Returns:
        Flask: Instancia de la aplicación Flask configurada.
    """
    app = Flask(__name__)
    app.config.from_object(Config)
    mail.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL")}}, supports_credentials=True)
    JWTManager(app)
    app.register_blueprint(reservas_bp, url_prefix="/api/reservas")
    app.register_blueprint(prereservas_bp, url_prefix="/api/prereservas")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(cliente_bp, url_prefix="/api")
    app.register_blueprint(categorias_bp, url_prefix="/api")
    app.register_blueprint(tarifas_bp, url_prefix="/api/tarifas")
    app.register_blueprint(pantallas_bp, url_prefix="/api/pantallas")
    app.register_blueprint(ciudad_bp,  url_prefix="/api/ciudades")
    limiter.init_app(app)

    @app.route("/healthz", methods=["GET"])
    def healthz():
        """
        Health check ligero para verificar que el servicio Flask está activo.

        No consulta Google Sheets ni servicios externos; únicamente confirma
        que la aplicación puede responder correctamente.
        """
        return jsonify({"status": "ok"}), 200
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        """
        Manejador de error para límite de peticiones (HTTP 429).

        Args:
            e (Exception): Excepción lanzada por el limitador.

        Returns:
            Response: Mensaje de error en formato JSON y código 429.
        """
        return jsonify({
            "error": "Has excedido el número de intentos permitidos. Por favor, intenta de nuevo más tarde."
        }), 429

    return app
