# Prisma LED - Sistema de Gestión de Pantallas Publicitarias

Bienvenido a **Prisma LED**, una plataforma integral para la gestión, reserva y administración de pantallas publicitarias en el Bulevar del Río, Cali.

## Descripción

Prisma LED permite a empresas y clientes:
- Consultar disponibilidad de pantallas por fecha, duración y categoría.
- Realizar reservas y prereservas de pauta publicitaria.
- Gestionar datos de clientes y usuarios.
- Visualizar el mapa de pantallas agrupadas por cilindro.
- Calcular precios, descuentos y ahorro en tiempo real.
- Recibir confirmaciones y notificaciones por correo electrónico.

El sistema está compuesto por:
- **Frontend**: Aplicación React con interfaz moderna y responsiva.
- **Backend**: API Flask que integra Google Sheets como base de datos y gestiona autenticación, lógica de negocio y envío de correos.

## Características principales

- **Reserva y edición de prereservas**: Flujo completo para seleccionar pantallas, definir duración y confirmar la pauta.
- **Visualización avanzada**: Mapa interactivo de pantallas con estados visuales y tooltips explicativos.
- **Gestión de clientes**: Registro, edición y recuperación de datos y contraseñas.
- **Seguridad**: Autenticación JWT, rate limiting y validaciones estrictas.
- **Integración con Google Sheets**: Almacenamiento eficiente y seguro de datos.
- **Notificaciones**: Envío de correos automáticos de confirmación y recuperación.

## Estructura del proyecto

```
prisma-led/
├── prisma-led-web/        # Frontend React
│   └── src/pages/         # Páginas principales (Disponibilidad, Reserva, Cliente, etc.)
├── prisma-led-back/       # Backend Flask
│   └── app/routes/        # Endpoints principales (auth, cliente, reservas, prereservas)
│   └── app/services/      # Servicios y utilidades (Google Sheets, validadores, retry)
│   └── app/tests/         # Scripts de prueba (flujo completo con k6)
```

## Instalación y ejecución

### Backend

1. Instala dependencias:
   ```
   pip install -r requirements.txt
   ```
2. Configura variables de entorno y credenciales de Google API.
3. Ejecuta el servidor:
   ```
   flask run
   ```

### Frontend

1. Instala dependencias:
   ```
   npm install
   ```
2. Ejecuta la aplicación:
   ```
   npm start
   ```

## Pruebas

- Usa el script `flujo_completo.js` con [k6](https://k6.io/) para pruebas de carga y flujo end-to-end.
- Los endpoints principales están documentados y cuentan con validaciones automáticas.

## Contribución

- Revisa la documentación interna de cada módulo para entender la lógica y reglas de negocio.
- Sigue las buenas prácticas de documentación y validación para mantener la calidad del proyecto.
- Puedes proponer mejoras, nuevos endpoints o integraciones según las necesidades del negocio.

## Futuro desarrollador

- El sistema está diseñado para escalabilidad y fácil mantenimiento.
- Puedes agregar nuevos tipos de pantallas, reglas de negocio, integraciones externas o módulos de analítica.
- El manejo de errores y mensajes está centralizado para facilitar la internacionalización y experiencia de usuario.

---

**Prisma LED** - Gestión inteligente de pantallas publicitarias en el corazón de Cali.
