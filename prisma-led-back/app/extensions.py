"""
Módulo de extensiones globales para la aplicación Flask de prisma-led-back.

Define instancias reutilizables de Mail, Limiter y varios Locks para sincronización de procesos críticos.
"""

from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import jsonify
from threading import Lock

# Instancia global para envío de correos
mail = Mail()

# Instancia global para limitar peticiones por IP
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Locks para sincronización en operaciones críticas
registro_lock = Lock()
recovery_lock = Lock()
pre_reserva_lock = Lock()
ciudad_lock = Lock()
detalle_pre_reserva_lock = Lock()