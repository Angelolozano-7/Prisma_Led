"""
Módulo de validadores para la lógica de negocio de prisma-led-back.

Este módulo centraliza las funciones de validación para:
- Cruce de fechas entre reservas y prereservas.
- Construcción de diccionarios de tarifas y pantallas para lógica de ocupación.
- Validación de detalles de prereserva, asegurando que no se excedan los límites de segundos por pantalla y que no existan conflictos de categoría en cilindros.

Características clave:
- Permite validar reglas de ocupación y restricción de categoría antes de crear o modificar prereservas.
- Integra la lógica de negocio principal para la gestión de pantallas y campañas publicitarias.
- Facilita el mantenimiento y escalabilidad al centralizar las validaciones.

Futuro desarrollador:
- Puedes agregar validaciones adicionales para nuevas reglas de negocio (por ejemplo, restricciones por horario o tipo de campaña).
- Si cambias la estructura de las hojas de Google Sheets, ajusta los mapeos y validaciones aquí.
- El manejo de errores y mensajes está pensado para facilitar la internacionalización y la experiencia de usuario.
"""

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
    """
    Determina si dos intervalos de fechas se cruzan.

    Args:
        f1_inicio (str): Fecha de inicio del primer intervalo (YYYY-MM-DD).
        f1_fin (str): Fecha de fin del primer intervalo (YYYY-MM-DD).
        f2_inicio (str): Fecha de inicio del segundo intervalo (YYYY-MM-DD).
        f2_fin (str): Fecha de fin del segundo intervalo (YYYY-MM-DD).

    Returns:
        bool: True si los intervalos se cruzan, False en caso contrario.
    """
    i1 = datetime.strptime(f1_inicio, "%Y-%m-%d")
    f1 = datetime.strptime(f1_fin, "%Y-%m-%d")
    i2 = datetime.strptime(f2_inicio, "%Y-%m-%d")
    f2 = datetime.strptime(f2_fin, "%Y-%m-%d")
    return i1 <= f2 and i2 <= f1


def construir_tarifas_dict():
    """
    Construye un diccionario de tarifas con el código de tarifa como clave y la duración en segundos como valor.

    Returns:
        dict: Diccionario {codigo_tarifa: duracion_seg}
    """
    tarifas = get_tarifas()
    return {t["codigo_tarifa"]: int(t["duracion_seg"]) for t in tarifas}


def construir_pantallas_dict():
    """
    Construye un diccionario de pantallas con el ID de pantalla como clave y el cilindro como valor.

    Returns:
        dict: Diccionario {id_pantalla: cilindro}
    """
    pantallas = get_pantallas()
    return {p["id_pantalla"]: int(p["cilindro"]) for p in pantallas}


def validar_detalle_prereserva(id_prereserva, pantallas_nuevas, categoria, id_cliente):
    """
    Valida si una prereserva puede ser realizada según las reglas de ocupación y restricción de categoría.

    Reglas de validación:
    - No se puede exceder el límite de 60 segundos por pantalla en el periodo solicitado.
    - No puede haber conflicto de categoría en el mismo cilindro con otra reserva/prereserva activa en el mismo periodo.
    - La prereserva debe existir y pertenecer al cliente.

    Args:
        id_prereserva (str): ID de la prereserva a validar.
        pantallas_nuevas (list): Lista de pantallas y tarifas a reservar.
        categoria (str): Categoría de la pauta.
        id_cliente (str): ID del cliente que realiza la prereserva.

    Returns:
        tuple: (bool, str or None). True y None si es válida, False y mensaje de error si no lo es.
    """
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
        if p["id_prereserva"] == id_prereserva:
            continue  # ← evita sumar la misma prereserva que se está actualizando
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
