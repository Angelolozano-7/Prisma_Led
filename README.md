# PrismaLED — módulo web de reservas

PrismaLED es el módulo web utilizado por clientes para consultar disponibilidad y reservar pauta en las pantallas publicitarias del Bulevar del Río, Cali.

## Arquitectura

- **prisma-led-web/**: frontend React + Vite + Tailwind.
- **prisma-led-back/**: API Flask conectada a Google Sheets.

```text
React / Vite
    ↓ HTTP + JWT
Flask API
    ↓
Google Sheets
    ↓
Flask-Mail / correo
```

## Funcionalidad principal

- Registro, login y recuperación de acceso.
- Consulta de disponibilidad por fecha, duración y categoría.
- Selección manual o selección mágica de pantallas.
- Cupos de 20, 40 o 60 segundos.
- Cálculo de precios, descuentos, temporada especial e IVA.
- Creación, consulta, edición y eliminación de reservas.
- Historial de pautas y reutilización de una pauta anterior.
- Confirmación por correo.

## Nomenclatura funcional e interna

El backend y Google Sheets conservan nombres históricos para no romper compatibilidad:

| Concepto funcional actual | Nombre interno legacy |
| --- | --- |
| Reserva | `prereserva` / `prereservas` |
| Detalle de reserva | `detalle_prereserva` |
| Pauta | `reserva` / `reservas` |
| Detalle de pauta | `detalle_reserva` |

## Requisitos

- Node.js y npm.
- Python 3.
- Cuenta de servicio de Google con acceso al spreadsheet.
- Variables de entorno del backend.

## Ejecutar backend

```powershell
cd prisma-led-back
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

Servidor local habitual: `http://127.0.0.1:5000`.

### Variables de entorno

Crear `prisma-led-back/.env` a partir de `prisma-led-back/.env.example`.

Variables utilizadas: `SECRET_KEY`, `JWT_SECRET_KEY`, `SPREADSHEET_ID`, `GOOGLE_CREDENTIALS_PATH`, `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_DEFAULT_SENDER` y `FRONTEND_URL`.

El archivo `.env` y las credenciales de Google no deben subirse al repositorio.

## Ejecutar frontend

```powershell
cd prisma-led-web
npm install
npm run dev
```

Vite mostrará la URL local, normalmente `http://localhost:5173`.

Build de producción:

```powershell
npm run build
```

## Estructura principal

```text
Prisma_Led/
├── prisma-led-back/
│   ├── app/routes/
│   ├── app/services/
│   ├── app/tests/
│   ├── requirements.txt
│   └── run.py
├── prisma-led-web/
│   ├── src/components/
│   ├── src/contexts/
│   ├── src/hooks/
│   ├── src/layouts/
│   ├── src/pages/
│   ├── src/router/
│   ├── src/services/
│   └── package.json
└── README.md
```

## Reglas de negocio relevantes

- Máximo de 60 segundos por pantalla.
- Cada cupo equivale a 20 segundos.
- La disponibilidad combina reservas actuales (`prereservas` legacy) y pautas (`reservas` legacy).
- Puede existir restricción de categoría a nivel de cilindro durante periodos solapados.
- La UI admite semanas o meses; actualmente 1 mes = 4 semanas.
- El cálculo contempla tarifa especial de diciembre, descuentos por duración e IVA.

## Pruebas

Los scripts k6 históricos están en `prisma-led-back/app/tests/`. Antes de tratarlos como suite de regresión deben revisarse contra los endpoints y respuestas actuales.

## Producción

`run.py` es el entrypoint de desarrollo. Antes del despliegue se revisarán servidor WSGI, `debug=False`, CORS, secretos, URL pública de la API, correo, logs y monitoreo.

## Flujo Git

Antes de trabajar:

```powershell
git switch cierre-proyecto
git pull
git status
```

Al terminar:

```powershell
git status
git add .
git status
git commit -m "Descripción del avance"
git push
```

La rama `main` recibirá los cambios finales mediante Pull Request tras el cierre, pruebas y despliegue.
