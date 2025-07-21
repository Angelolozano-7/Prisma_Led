"""
Archivo principal para ejecutar la aplicación Flask de prisma-led-back.

Este archivo importa la función create_app, instancia la aplicación y la ejecuta en modo debug.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
