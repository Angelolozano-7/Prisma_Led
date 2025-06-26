from flask_mail import Message
from app import mail
from flask import current_app

def enviar_correo_prereserva(destinatario, asunto, cuerpo_html):
    msg = Message(
        subject=asunto,
        sender=current_app.config["MAIL_USERNAME"],
        recipients=[destinatario]
    )
    msg.html = cuerpo_html
    mail.send(msg)
