from app.services.sheets_client import (
    get_pantallas,
    get_tarifas,
    get_reservas,
    get_detalle_reserva,
    get_prereservas,
    get_detalle_prereserva
)
from datetime import datetime


def hay_cruce(f1_inicio, f1_fin, f2_inicio, f2_fin):
    i1 = datetime.strptime(f1_inicio, "%Y-%m-%d")
    f1 = datetime.strptime(f1_fin, "%Y-%m-%d")
    i2 = datetime.strptime(f2_inicio, "%Y-%m-%d")
    f2 = datetime.strptime(f2_fin, "%Y-%m-%d")
    return i1 <= f2 and i2 <= f1


def construir_tarifas_dict():
    tarifas = get_tarifas()
    return {t["codigo_tarifa"]: int(t["duracion_seg"]) for t in tarifas}


def construir_pantallas_dict():
    pantallas = get_pantallas()
    return {p["id_pantalla"]: int(p["cilindro"]) for p in pantallas}


def validar_detalle_prereserva(id_prereserva, pantallas_nuevas, categoria, id_cliente):
    tarifas_dict = construir_tarifas_dict()
    pantallas_dict = construir_pantallas_dict()

    reservas = get_reservas()
    detalle_reserva = get_detalle_reserva()
    prereservas = get_prereservas()
    detalle_prereserva = get_detalle_prereserva()

    # Obtener fechas de la prereserva actual
    pr = next((p for p in prereservas if p["id_prereserva"] == id_prereserva), None)
    if not pr:
        return False, "Pre-reserva no encontrada"

    fecha_inicio = pr["fecha_inicio"]
    fecha_fin = pr["fecha_fin"]

    # Construir mapas pantalla -> segundos ya ocupados
    ocupacion = {}
    for r in reservas:
        if not hay_cruce(r["fecha_inicio"], r["fecha_fin"], fecha_inicio, fecha_fin):
            continue
        detalles = [d for d in detalle_reserva if d["id_reserva"] == r["id_reserva"]]
        for d in detalles:
            seg = tarifas_dict.get(d["codigo_tarifa"], 0)
            ocupacion[d["id_pantalla"]] = ocupacion.get(d["id_pantalla"], 0) + seg

    for p in prereservas:
        if not hay_cruce(p["fecha_inicio"], p["fecha_fin"], fecha_inicio, fecha_fin):
            continue
        detalles = [d for d in detalle_prereserva if d["id_prereserva"] == p["id_prereserva"]]
        for d in detalles:
            seg = tarifas_dict.get(d["codigo_tarifa"], 0)
            ocupacion[d["id_pantalla"]] = ocupacion.get(d["id_pantalla"], 0) + seg

    # Validar que no supere 60s por pantalla
    for p in pantallas_nuevas:
        segundos_nuevos = tarifas_dict.get(p["cod_tarifas"], 0)
        total = ocupacion.get(p["id_pantalla"], 0) + segundos_nuevos
        if total > 60:
            return False, f"La pantalla {p['id_pantalla']} excede el límite de 60 segundos"

    # Validar conflicto de categoría (restringido)
    for r in reservas + prereservas:
        if r.get("id_cliente") == id_cliente:
            continue
        if not hay_cruce(r["fecha_inicio"], r["fecha_fin"], fecha_inicio, fecha_fin):
            continue
        detalles = detalle_reserva if "id_reserva" in r else detalle_prereserva
        key = "id_reserva" if "id_reserva" in r else "id_prereserva"
        r_id = r[key]
        pantallas_reserva = [d for d in detalles if d[key] == r_id]

        for d in pantallas_reserva:
            if d["categoria"] != categoria:
                continue
            cilindro_existente = pantallas_dict.get(d["id_pantalla"])
            cilindros_nuevos = {pantallas_dict.get(p["id_pantalla"]) for p in pantallas_nuevas}
            if cilindro_existente in cilindros_nuevos:
                return False, f"Conflicto de categoría en cilindro {cilindro_existente}"

    return True, None
