from flask import Flask
from flask_cors import CORS
from app.config import Config
from flask_jwt_extended import JWTManager

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    jwt = JWTManager(app)

    from app.routes.reservas import reservas_bp
    from app.routes.auth import auth_bp
    app.register_blueprint(reservas_bp, url_prefix="/api/reservas")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app
