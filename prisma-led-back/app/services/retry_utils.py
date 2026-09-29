"""
Utilidad de reintentos para operaciones contra Google APIs.

retry_on_rate_limit reintenta errores HTTP 429, 500 y 503 con backoff
exponencial y jitter para tolerar límites de cuota y fallos transitorios.
"""


import time
import random
from functools import wraps
from googleapiclient.errors import HttpError

def retry_on_rate_limit(max_retries=5, base_delay=1.0):
    """
    Decorador para reintentar funciones que lanzan HttpError 429, 500 o 503.

    Realiza reintentos exponenciales con un pequeño factor aleatorio para evitar colisiones.
    Si se agotan los reintentos, lanza una excepción.

    Args:
        max_retries (int): Número máximo de reintentos.
        base_delay (float): Tiempo base de espera entre reintentos en segundos.

    Returns:
        function: Función decorada con lógica de reintentos.
    """
    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except HttpError as e:
                    if e.resp.status in [429, 500, 503]:
                        wait = base_delay * (2 ** retries) + random.uniform(0, 0.5)
                        print(f"[RETRY {retries+1}] Esperando {wait:.2f}s por error {e.resp.status}")
                        time.sleep(wait)
                        retries += 1
                    else:
                        raise
            raise Exception(f"Reintentos agotados por error {e.resp.status}")
        return wrapped
    return decorator
