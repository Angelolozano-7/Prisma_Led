"""
Generación de identificadores técnicos para usuarios.

Los IDs de usuario son UUID hexadecimales truncados a 8 caracteres y se verifican contra
Google Sheets. No deben confundirse con el UXID, identificador secuencial
visible utilizado para facilitar la referencia de registros.
"""


import uuid
from app.services.sheets_client import connect_sheet

def generate_unique_user_id():
    """
    Genera un identificador único para un usuario.

    Consulta la hoja 'usuarios' y asegura que el ID generado no exista previamente.

    Returns:
        str: ID único de usuario (8 caracteres hexadecimales).
    """
    sheet = connect_sheet().worksheet("usuarios")
    existing_ids = [u["id_usuario"] for u in sheet.get_all_records()]

    while True:
        new_id = uuid.uuid4().hex[:8]
        if new_id not in existing_ids:
            return new_id
