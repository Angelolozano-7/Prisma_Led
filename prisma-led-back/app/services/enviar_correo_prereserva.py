"""
Módulo para el envío de correos electrónicos de confirmación de prereserva en prisma-led-back.

Utiliza Flask-Mail para enviar mensajes HTML a los destinatarios especificados.
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
