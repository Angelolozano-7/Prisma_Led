"""
Utilidad de envío de correo HTML asociada al flujo legacy de prereservas.

La función encapsula Flask-Mail para enviar un mensaje HTML a un destinatario.
En el flujo web actual, routes/prereservas.py construye y envía el correo de
confirmación directamente; este módulo se conserva como utilidad independiente
mientras se completa la limpieza final.
"""


from flask_mail import Message
from app import mail
from flask import current_app

def enviar_correo_prereserva(destinatario, asunto, cuerpo_html):
    """
    Envía un correo electrónico de confirmación de prereserva.

    Args:
        destinatario (str): Dirección de correo del destinatario.
        asunto (str): Asunto del correo.
        cuerpo_html (str): Contenido HTML del mensaje.

    Returns:
        None
    """
    msg = Message(
        subject=asunto,
        sender=current_app.config["MAIL_USERNAME"],
        recipients=[destinatario]
    )
    msg.html = cuerpo_html
    mail.send(msg)
