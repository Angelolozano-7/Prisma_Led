from flask import Flask
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


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    mail.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL")}}, supports_credentials=True)
    jwt = JWTManager(app)
    app.register_blueprint(reservas_bp, url_prefix="/api/reservas")
    app.register_blueprint(prereservas_bp, url_prefix="/api/prereservas")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(cliente_bp, url_prefix="/api")
    app.register_blueprint(categorias_bp, url_prefix="/api")
    app.register_blueprint(tarifas_bp, url_prefix="/api/tarifas")
    app.register_blueprint(pantallas_bp, url_prefix="/api/pantallas")

    

    return app
