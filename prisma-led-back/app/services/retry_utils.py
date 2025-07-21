"""
Módulo de utilidades para reintentos automáticos en prisma-led-back.

Este módulo provee un decorador para reintentar funciones que interactúan con Google Sheets
cuando se reciben errores de límite de tasa (HTTP 429), errores internos (HTTP 500) o servicio no disponible (HTTP 503).

Características clave:
- Implementa reintentos exponenciales con factor aleatorio para evitar colisiones entre múltiples procesos.
- Permite configurar el número máximo de reintentos y el tiempo base de espera.
- Si se agotan los reintentos, lanza una excepción clara para manejo en el endpoint.
- Útil para proteger operaciones críticas contra los límites de Google API y mejorar la robustez del sistema.

Futuro desarrollador:
- Puedes ajustar los códigos de error o el algoritmo de espera según la lógica de negocio.
- El decorador puede ser extendido para otros servicios externos que requieran tolerancia a fallos.
- El manejo de logs y métricas puede ser integrado para monitoreo avanzado de reintentos.
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
