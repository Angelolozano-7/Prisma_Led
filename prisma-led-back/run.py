"""
Punto de entrada local del backend de PrismaLED.

Crea la aplicación Flask mediante app.create_app() y arranca el servidor
de desarrollo de Flask. En producción debe utilizarse un servidor WSGI y
el modo debug debe permanecer deshabilitado.
"""


from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
