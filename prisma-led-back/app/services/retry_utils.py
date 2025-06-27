# puedes pegar esto arriba en sheets_client.py
import time
import random
from functools import wraps
from googleapiclient.errors import HttpError

def retry_on_rate_limit(max_retries=5, base_delay=1.0):
    """
    Decorador para reintentar funciones que lanzan HttpError 429 o 503
    """
    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except HttpError as e:
                    if e.resp.status in [429, 503]:
                        wait = base_delay * (2 ** retries) + random.uniform(0, 0.5)
                        print(f"[RETRY {retries+1}] Esperando {wait:.2f}s por error {e.resp.status}")
                        time.sleep(wait)
                        retries += 1
                    else:
                        raise
            raise Exception(f"Reintentos agotados por error {e.resp.status}")
        return wrapped
    return decorator
