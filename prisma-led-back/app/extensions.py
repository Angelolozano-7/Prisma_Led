from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import jsonify
from threading import Lock

mail = Mail()

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

registro_lock = Lock()
recovery_lock = Lock()
pre_reserva_lock = Lock()
ciudad_lock = Lock()
detalle_pre_reserva_lock = Lock()