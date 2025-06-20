from flask import Flask
from flask_cors import CORS
from app.config import Config
from flask_jwt_extended import JWTManager
from .extensions import mail
from app.config import Config
from app.routes.cliente import cliente_bp
from app.routes.reservas import reservas_bp
from app.routes.auth import auth_bp
import os



def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    mail.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL")}}, supports_credentials=True)
    jwt = JWTManager(app)
    app.register_blueprint(reservas_bp, url_prefix="/api/reservas")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(cliente_bp, url_prefix="/api")
    

    return app
