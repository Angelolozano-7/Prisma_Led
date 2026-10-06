# Despliegue y operación de PRISMALED

Esta guía permite repetir una publicación autorizada y restaurar una versión anterior. Durante este cierre no se ha modificado la configuración de Render, cPanel, Cloudflare, WordPress o Sheets. Los datos de proveedor y worker proceden del propietario; los comandos propuestos se derivan del código, y los campos no verificados se marcan expresamente.

## Configuración que debe conservarse en la entrega

| Campo | Estado o valor documentado |
| --- | --- |
| Repositorio | Angelolozano-7/Prisma_Led |
| Rama de trabajo documental | cierre-proyecto |
| Rama conectada a Render | PENDIENTE de lectura del panel; no inferir de la rama de trabajo. |
| Servicio | prismaled-api, declarado por propietario |
| Root Directory | prisma-led-back como valor compatible derivado de la estructura; confirmar en panel. |
| Build | pip install -r requirements.txt, procedimiento compatible con Render y código. |
| WSGI | run:app, objeto exportado por run.py. |
| Start propuesto | gunicorn run:app --workers 1 --bind 0.0.0.0:$PORT |
| Workers e instancias | Un worker declarado; verificar que también hay una sola instancia. |
| Health path | /healthz, implementado y comprobado. |
| API pública | https://api.prismawall.com.co |
| Web pública | https://reservas.prismawall.com.co |
| Ruta y nombre de Secret File | PENDIENTE del panel; GOOGLE_CREDENTIALS_PATH debe coincidir exactamente. |
| Auto Deploy runtime y último SHA | PENDIENTE del panel; registrar antes de publicar. |

No presentar esta tabla como una captura del panel. La estructura soporta el comando, pero la línea exacta vigente puede incluir parámetros adicionales no aportados. La guía oficial de Render confirma el uso de pip y Gunicorn: https://render.com/docs/deploy-flask.
## Variables de entorno

| Variable | Uso y valor de referencia sin secretos |
| --- | --- |
| SECRET_KEY | Firma interna Flask. Valor aleatorio privado, diferente entre entornos. |
| JWT_SECRET_KEY | Firma JWT. Valor aleatorio privado, no entregarlo al frontend. |
| SPREADSHEET_ID | Identifica el Sheet autorizado. Usar una copia de pruebas en desarrollo. |
| GOOGLE_CREDENTIALS_PATH | Ruta del JSON de cuenta de servicio; local credentials/credentials.json y en Render la ruta absoluta de Secret File. |
| MAIL_SERVER | Servidor SMTP del proveedor contratado. |
| MAIL_PORT | Puerto SMTP entero; ejemplo 587. Obligatorio: int(None) impediría importar Config. |
| MAIL_USE_TLS | Solo el literal True activa TLS en el código actual. |
| MAIL_USERNAME | Usuario SMTP privado. Recuperación lo usa además como remitente explícito. |
| MAIL_PASSWORD | Contraseña SMTP privada. |
| MAIL_DEFAULT_SENDER | Remitente predeterminado para confirmaciones. |
| FRONTEND_URL | Origen CORS único. Desarrollo http://localhost:5173; producción https://reservas.prismawall.com.co. |
| VITE_API_URL | URL pública de API que Vite inserta durante el build. Local http://localhost:5000/api; producción https://api.prismawall.com.co/api. |

Config lee las once variables de backend anteriores. FRONTEND_URL se lee en la fábrica Flask. VITE_API_URL no es un secreto: cualquier visitante puede ver su valor en el JavaScript compilado. Cambiarla exige un nuevo build. PORT lo proporciona Render y lo consume el comando de inicio propuesto; no es una variable leída por Config.

## Publicar backend cuando exista autorización

1. Registrar SHA vigente, rama vinculada, versión Python, comando de inicio, variables, Secret File, dominio y estado de Auto Deploy. Guardar los valores sensibles solo en un almacén privado.
2. Revisar el diff de la rama autorizada. No cambiar main ni ejecutar force push. Si Render publica automáticamente esa rama, un push puede activar un despliegue: ajustar el procedimiento con el responsable antes de un cambio funcional.
3. En Render comprobar el repositorio y Root Directory. El build debe instalar requirements desde prisma-led-back y Gunicorn debe importar run:app con un worker. Conservar el puerto de Render y el bind a 0.0.0.0.
4. Configurar las variables backend. Subir el JSON de cuenta de servicio mediante Secret File y comprobar su ruta absoluta. Compartir el Sheet correcto con la cuenta de servicio como editor. No pegar el JSON en README ni en el repositorio.
5. Comprobar custom domain api.prismawall.com.co y el registro DNS requerido por Render. Confirmar su certificado y esperar verificación antes de conmutar tráfico.
6. Ejecutar el despliegue autorizado. Observar los logs de importación y arranque, luego GET /healthz y una consulta de lectura a la API. Health no comprueba Sheets ni SMTP.
7. Comprobar CORS con Origin https://reservas.prismawall.com.co. Validar un flujo con cuenta y datos de prueba si el cambio lo exige, sin repetir eliminaciones de producción innecesarias.
8. Registrar hora, SHA, resultado, responsable y rollback disponible. No ampliar workers hasta resolver la coordinación de límites y locks.

## Publicar frontend cuando exista autorización

Desde prisma-led-web ejecutar npm ci. Revisar que VITE_API_URL de build sea https://api.prismawall.com.co/api y que ningún .env local la sobrescriba con localhost. Ejecutar npm run build y comprobar dist/index.html, assets y .htaccess. Probar la navegación con npm run preview.

Crear un ZIP del contenido de dist, incluidos archivos que empiezan por punto. index.html debe quedar en la raíz del ZIP, no dentro de una carpeta dist adicional. Guardar un respaldo de la publicación vigente antes de reemplazar archivos. En cPanel verificar el Document Root del subdominio reservas.prismawall.com.co: no asumir public_html ni sobrescribir WordPress.

Subir el ZIP al Document Root confirmado y extraer allí. Revisar que la raíz tenga index.html, assets y .htaccess. Como referencia habitual, directorios 755 y archivos 644; preservar los permisos y propietario que exija el hosting. No se verificaron los permisos actuales. Activar la visualización de archivos ocultos en el administrador si .htaccess no aparece.

public/.htaccess usa mod_rewrite: sirve archivos y directorios existentes y envía las demás rutas a index.html. Comprobar apertura directa y recarga de /auth/login, /auth/registro y una ruta privada. El backend nunca se publica en esta carpeta estática. Conservar el respaldo fuera del contenido público y no dejar JSON de servicio o .env accesibles.

## Cloudflare dominios y HTTPS

La configuración declarada es CNAME api al destino facilitado por Render y A reservas a la IP del hosting. No se obtuvieron el panel DNS, IP, TTL ni estado de proxy. Verificar esos valores con los paneles y la validación de dominio del proveedor, sin inventarlos. Conservar HTTPS en frontend y API y revisar que el tráfico entre usuario y proveedor también esté cifrado según la configuración efectivamente contratada.

Una respuesta HTTP 200 desde el dominio acredita accesibilidad en ese momento; no certifica toda la configuración DNS. Tras un cambio autorizado, comprobar certificado, redirección HTTP a HTTPS, ausencia de contenido mixto y que el JavaScript compilado apunte a la API definitiva. La página comercial prismawall.com.co/pantallas-led queda PENDIENTE DE VALIDACIÓN DEL CLIENTE.

## Operación copias y recuperación

Antes de cambios en datos, conservar una copia privada del Sheet, archivos AppSheet asociados y configuración de la aplicación. Una copia del Sheet por sí sola no incluye el código ni los triggers de Apps Script, ni todos los archivos de videos y facturas. Registrar quién custodia GitHub, Render, cPanel, Cloudflare, Google Workspace, AppSheet y SMTP y cómo se transfiere su acceso. La entrega documental no sustituye esa transferencia.

Para rollback backend, volver a desplegar el SHA anterior mediante la opción del servicio disponible en Render, preservando secretos y dominio. Evitar revertir historial Git por fuerza. Para frontend, restaurar el contenido completo del respaldo cPanel y comprobar rutas y API. Un rollback del código no revierte datos ya escritos en Sheets. Si hubo edición o eliminación parcial, detener nuevas escrituras con un procedimiento autorizado y conciliar copia frente a movimientos posteriores; no restaurar toda la hoja a ciegas.

Monitorizar /healthz sin exceder las cuotas, errores 5xx, fallos SMTP y de Sheets, duplicados y detalles huérfanos. /healthz está sujeto a los defaults del limitador: un monitor muy frecuente puede producir 429. No se instaló monitoreo nuevo en este cierre. Revisar las automatizaciones externas en Apps Script y el estado de despliegue de AppSheet antes de formalizar recepción.

## Diagnóstico de incidencias

| Síntoma | Comprobación inicial |
| --- | --- |
| Config no importa | MAIL_PORT definido como entero y dependencias disponibles. |
| Health 200 pero falla información | Permisos del Sheet, ID, ruta JSON y cuotas Google. |
| CORS o navegador bloquea respuesta | FRONTEND_URL exacto, /api y HTTPS sin contenido mixto. |
| Recargar una ruta muestra 404 | .htaccess presente, Document Root y mod_rewrite. |
| API apunta a localhost | Variable de build y artefacto publicado, luego nuevo build autorizado. |
| Correo no llega | Logs SMTP, remitente, TLS literal True, spam y correo_enviado. |
| 429 | Límite específico por endpoint y contador en memoria, no asumir fallo de datos. |
| Actualización dejó detalles incompletos | Consultar copia y movimientos, reconciliar con responsable. |
| Build Windows devuelve EPERM realpath | Limitación observada en esta sesión; compilar en entorno habitual o usar configuración temporal preserveSymlinks para verificar sin modificar repo. |

La verificación local consiguió build con preserveSymlinks desde la carpeta frontend; el comando estándar falló por EPERM del entorno. No publicar automáticamente ese dist de verificación como artefacto oficial de producción. El dato se registra como límite de la prueba, no como defecto del producto.
## Fuentes y límites de verificación

Código de Angelolozano-7/Prisma_Led, rama cierre-proyecto, commit d47a6ee2af98501a1bd168ac93bac57b2d948d0d, consultado el 6 de octubre de 2026. Las rutas y reglas descritas corresponden a esta revisión; no se obtuvo el SHA desplegado en Render ni el manifiesto de la publicación cPanel.

BD_PrismaLed, cuenta Drive Bulevar: se verificaron metadatos, encabezados de las 16 hojas y tarifas. No se exportaron datos de clientes, contraseñas ni credenciales. Diagrama ER-PRISMA-FINAL.png contrastado con la estructura física. Documentación AppSheet del 30/09/2026 y los turnos disponibles de Fase de cierre proyecto y Desarrollo módulo administrativo. La herramienta solo entregó cinco turnos recientes del chat de cierre y no ofreció paginación; no se afirma haber leído su historial completo.

Las instrucciones del propietario acreditan el despliegue y una prueba satisfactoria del flujo funcional completo. Esa declaración se distingue de las pruebas nuevas de esta auditoría. La propuesta, cronograma, preguntas, requisitos, historias General/M1/M2 y prisma-led.zip no se localizaron en las fuentes accesibles; faltan para cerrar trazabilidad contractual completa. La presentación comercial de 2025 se revisó como referencia histórica; sus cifras no sustituyen el código ni las tarifas actuales.
