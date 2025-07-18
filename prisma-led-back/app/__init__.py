from flask import Flask,jsonify
from flask_cors import CORS
from app.config import Config
from flask_jwt_extended import JWTManager
from .extensions import mail
from app.config import Config
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
    app = Flask(__name__)
    app.config.from_object(Config)
    mail.init_app(app)
    print("FRONTEND_URL:", os.getenv("FRONTEND_URL"))
    CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL")}}, supports_credentials=True)
    jwt = JWTManager(app)
    app.register_blueprint(reservas_bp, url_prefix="/api/reservas")
    app.register_blueprint(prereservas_bp, url_prefix="/api/prereservas")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(cliente_bp, url_prefix="/api")
    app.register_blueprint(categorias_bp, url_prefix="/api")
    app.register_blueprint(tarifas_bp, url_prefix="/api/tarifas")
    app.register_blueprint(pantallas_bp, url_prefix="/api/pantallas")
    app.register_blueprint(ciudad_bp,  url_prefix="/api/ciudades")
    limiter.init_app(app)
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            "error": "Has excedido el número de intentos permitidos. Por favor, intenta de nuevo más tarde."
        }), 429


    return app
