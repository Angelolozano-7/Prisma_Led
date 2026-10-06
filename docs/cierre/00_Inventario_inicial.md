# Inventario inicial de cierre de PRISMALED

Fecha: 6 de octubre de 2026. Inventario generado antes de modificar el repositorio.

Rama: cierre-proyecto. Commit base: d47a6ee2af98501a1bd168ac93bac57b2d948d0d.
Archivos versionados: 79. Archivos de texto examinados: 64. Hallazgos de patrones de secretos en el árbol actual: 0. La búsqueda por patrones no garantiza ausencia absoluta ni certifica el historial.

## Fuentes disponibles

- Repositorio completo descargado desde GitHub; fuente de comportamiento de la rama, sin prueba independiente de que el mismo SHA esté desplegado.
- BD_PrismaLed en Drive de Bulevar: metadatos, 16 encabezados y tarifas, sin copiar registros de clientes ni hashes.
- ER-PRISMA-FINAL.png: diagrama contrastado con los encabezados actuales.
- Exportación de AppSheet del 30/09/2026 aportada en Desarrollo módulo administrativo: 16 tablas, 234 columnas, 1 slice, 76 vistas y 116 acciones.
- Fase de cierre proyecto: lectura disponible de 5 turnos recientes; la herramienta devuelve hasMore=false. No equivale al historial íntegro de desarrollo.
- Presentación Prisma LED Bulevar 2025.pptx: archivo adjunto accesible. Fuente histórica, sin usar tarifas antiguas.
- Instrucciones de cierre adjuntas: estado de producción y límites autorizados.

## Fuentes no localizadas

Propuesta de Desarrollo de Software - PRISMALED.pdf, Cronograma.xlsx, Preguntas - rta.docx, Requisitos bruto.docx, historias de usuario General/M1/M2 y prisma-led.zip: no localizados en la carpeta PL-Dev, búsqueda dirigida de Drive de Bulevar ni adjuntos locales identificables. Su existencia en el proyecto histórico no acredita su lectura aquí.

## Estado anterior a cambios

Frontend React 18, Vite 4, Router 7, Axios y Tailwind 3. API Flask y Sheets. No hay scripts de test en package.json ni app/tests en el árbol actual. README contiene referencias obsoletas a esa carpeta y al despliegue futuro. Los ejemplos de entorno existen y no contienen claves.

## Hojas físicas

- usuarios: id_usuario, nombre, correo, telefono, rol, password_hash, fecha_creacion, Creado_por, uxid
- clientes: id_cliente, razon_social, nit, correo_electronico, ciudad, direccion, telefono_contacto, nombre_contacto, uxid
- pantallas: id_pantalla, cilindro, identificador, estado, observacion
- _prereservas_cache (oculta): id_prereserva, id_cliente, fecha_inicio, fecha_fin, estado, fecha_creacion, correo_enviado, uxid, url_oc, aviso_3d_enviado, aviso_1d_enviado, aviso_vencimiento_enviado
- reservas: id_reserva, id_cliente, fecha_inicio, fecha_fin, estado, fecha_creacion, uxid, url_oc
- detalle_reserva: id_detalle_reserva, id_reserva, id_pantalla, categoria, codigo_tarifa, uxid, video_cargado
- prereservas: id_prereserva, id_cliente, fecha_inicio, fecha_fin, estado, fecha_creacion, correo_enviado, uxid, url_oc, aviso_3d_enviado, aviso_1d_enviado, aviso_vencimiento_enviado
- detalle_prereserva: id_detalle_prereserva, id_prereserva, id_pantalla, categoria, codigo_tarifa, uxid
- ciudades: nombre_ciudad
- videos: id_video, referencia, url_archivo, uxid
- video_detalle_reserva: id_video_detalle_reserva, id_video, id_detalle_reserva, fecha_subida, fecha_bajada, uxid
- facturacion: id_factura, id_reserva, fecha_factura, valor, valor_pagado, fecha_pago, estado, metodo, uxid, url_fact
- costos_operativos: id_costo, tipo, descripcion, valor, fecha, uxid
- tarifas: codigo_tarifa, descripcion, duracion_seg, precio_semana
- reportes: id_reporte, tipo, periodo, fecha_generacion, descripcion, uxid
- categorias: nombre

## Archivos del repositorio

- .gitignore
- README.md
- prisma-led-back/.env.example
- prisma-led-back/.gitignore
- prisma-led-back/app/__init__.py
- prisma-led-back/app/config.py
- prisma-led-back/app/extensions.py
- prisma-led-back/app/routes/auth.py
- prisma-led-back/app/routes/categorias.py
- prisma-led-back/app/routes/ciudad.py
- prisma-led-back/app/routes/cliente.py
- prisma-led-back/app/routes/pantallas.py
- prisma-led-back/app/routes/prereservas.py
- prisma-led-back/app/routes/reservas.py
- prisma-led-back/app/routes/tarifas.py
- prisma-led-back/app/services/id_user_generator.py
- prisma-led-back/app/services/retry_utils.py
- prisma-led-back/app/services/sheets_client.py
- prisma-led-back/app/services/uxid.py
- prisma-led-back/app/services/validadores.py
- prisma-led-back/requirements.txt
- prisma-led-back/run.py
- prisma-led-web/.env.example
- prisma-led-web/index.html
- prisma-led-web/package-lock.json
- prisma-led-web/package.json
- prisma-led-web/postcss.config.js
- prisma-led-web/public/.htaccess
- prisma-led-web/src/assets/cilindro1.png
- prisma-led-web/src/assets/cilindro10.png
- prisma-led-web/src/assets/cilindro11.png
- prisma-led-web/src/assets/cilindro12.png
- prisma-led-web/src/assets/cilindro2.png
- prisma-led-web/src/assets/cilindro3.png
- prisma-led-web/src/assets/cilindro4.png
- prisma-led-web/src/assets/cilindro5.png
- prisma-led-web/src/assets/cilindro6.png
- prisma-led-web/src/assets/cilindro7.png
- prisma-led-web/src/assets/cilindro8.png
- prisma-led-web/src/assets/cilindro9.png
- prisma-led-web/src/assets/favicon.png
- prisma-led-web/src/assets/loader.mp4
- prisma-led-web/src/assets/logo_prisma.png
- prisma-led-web/src/components/BusquedaInline.jsx
- prisma-led-web/src/components/CilindroBox.jsx
- prisma-led-web/src/components/CilindroModal.jsx
- prisma-led-web/src/components/PantallaItem.jsx
- prisma-led-web/src/components/PrivateRoute.jsx
- prisma-led-web/src/components/VideoLoader.jsx
- prisma-led-web/src/contexts/AppDataContext.jsx
- prisma-led-web/src/contexts/PrereservaContext.jsx
- prisma-led-web/src/hooks/useAppData.js
- prisma-led-web/src/hooks/useResumenReserva.js
- prisma-led-web/src/hooks/useSessionTimer.js
- prisma-led-web/src/index.css
- prisma-led-web/src/layouts/Layout1.jsx
- prisma-led-web/src/layouts/Layout2.jsx
- prisma-led-web/src/layouts/Layout3.jsx
- prisma-led-web/src/main.jsx
- prisma-led-web/src/pages/Client_Home.jsx
- prisma-led-web/src/pages/Disponibilidad.jsx
- prisma-led-web/src/pages/Editar_Cliente.jsx
- prisma-led-web/src/pages/Editar_Reserva.jsx
- prisma-led-web/src/pages/ForceLogoutRedirect.jsx
- prisma-led-web/src/pages/Historial_Reservas.jsx
- prisma-led-web/src/pages/HomePage.jsx
- prisma-led-web/src/pages/Login.jsx
- prisma-led-web/src/pages/Pre_Orden.jsx
- prisma-led-web/src/pages/Pre_Orden_Doc.jsx
- prisma-led-web/src/pages/Pre_Visualizacion.jsx
- prisma-led-web/src/pages/Recovery.jsx
- prisma-led-web/src/pages/Registro.jsx
- prisma-led-web/src/pages/Reserva.jsx
- prisma-led-web/src/router/AppRouter.jsx
- prisma-led-web/src/services/api.js
- prisma-led-web/src/services/ciudadService.js
- prisma-led-web/src/services/decodeToken.js
- prisma-led-web/tailwind.config.js
- prisma-led-web/vite.config.js
