# uxid.py
import threading
from app.services.sheets_client import connect_sheet

# Lock por tabla (concurrencia intra-proceso)
_TABLE_LOCKS = {}

def _get_lock(table: str) -> threading.Lock:
    lock = _TABLE_LOCKS.get(table)
    if lock is None:
        lock = threading.Lock()
        _TABLE_LOCKS[table] = lock
    return lock

def _ensure_column_and_get_index(ws, column_name: str) -> int:
    """
    Asegura que exista la columna `column_name` en el encabezado y devuelve su índice (1-based).
    Si no existe, la crea al final.
    """
    header = ws.row_values(1) or []
    if column_name in header:
        return header.index(column_name) + 1
    idx = len(header) + 1
    ws.update_cell(1, idx, column_name)
    return idx

def _to_ints(values):
    """Convierte a enteros solo las celdas que son dígitos puros."""
    nums = []
    for v in values:
        if v is None:
            continue
        s = str(v).strip()
        if s.isdigit():        # <-- solo números puros (sin '#', sin 'UX-')
            nums.append(int(s))
    return nums

def generate_next_uxid(table_name: str, column_name: str = "uxid") -> int:
    """
    Devuelve el siguiente UXID para `table_name`:
      - Si no hay UXIDs numéricos => 1
      - Si ya existen => max(existentes) + 1
    """
    with _get_lock(table_name):
        ws = connect_sheet().worksheet(table_name)
        col_idx = _ensure_column_and_get_index(ws, column_name)
        existing_vals = ws.col_values(col_idx)[1:]  # sin header
        nums = _to_ints(existing_vals)
        return (max(nums) + 1) if nums else 1
