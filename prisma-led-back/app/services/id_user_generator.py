import uuid
from app.services.sheets_client import connect_sheet

def generate_unique_user_id():
    sheet = connect_sheet().worksheet("usuarios")
    existing_ids = [u["id_usuario"] for u in sheet.get_all_records()]

    while True:
        new_id = uuid.uuid4().hex[:8]
        if new_id not in existing_ids:
            return new_id

def generate_unique_client_id():
    sheet = connect_sheet().worksheet("clientes")
    existing_ids = [c["id_cliente"] for c in sheet.get_all_records()]

    while True:
        new_id = uuid.uuid4().hex[:8]
        if new_id not in existing_ids:
            return new_id
