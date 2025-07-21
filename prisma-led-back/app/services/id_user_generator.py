"""
Módulo para generación de identificadores únicos de usuario y cliente en prisma-led-back.

Utiliza UUID y verifica contra la hoja de cálculo para evitar duplicados.
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

def generate_unique_client_id():
    """
    Genera un identificador único para un cliente.

    Consulta la hoja 'clientes' y asegura que el ID generado no exista previamente.

    Returns:
        str: ID único de cliente (8 caracteres hexadecimales).
    """
    sheet = connect_sheet().worksheet("clientes")
    existing_ids = [c["id_cliente"] for c in sheet.get_all_records()]

    while True:
        new_id = uuid.uuid4().hex[:8]
        if new_id not in existing_ids:
            return new_id
