"""
Extensiones compartidas del backend de PrismaLED.

Define Flask-Mail, Flask-Limiter y locks para serializar operaciones críticas.
Los locks de threading protegen únicamente concurrencia dentro del mismo
proceso; no sustituyen bloqueo distribuido entre varios workers.
"""


from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
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