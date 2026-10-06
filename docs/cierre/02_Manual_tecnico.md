# Manual técnico de PRISMALED

Este documento permite a un desarrollador instalar, mantener y operar la web de reservas y su API. La entrega documental está preparada; la aceptación técnica definitiva queda condicionada a los hallazgos de seguridad e integridad descritos en el documento de deuda. Esta edición conserva reglas y lógica funcional.

## Componentes y responsabilidades

prisma-led-web contiene React 18, Vite 4, React Router 7 en modo declarativo, Axios, Tailwind 3, React Select, SweetAlert2 y Lucide. package.json define dev, build y preview; no define test ni lint. package-lock.json fija la resolución del frontend. index.html carga src/main.jsx, que renderiza AppRouter bajo StrictMode.

prisma-led-back contiene Flask, Flask-CORS, Flask-JWT-Extended, Flask-Mail, Flask-Limiter, gspread, google-auth, pandas, google-api-python-client, Werkzeug, python-dotenv y Gunicorn. requirements.txt declara esas doce dependencias sin fijar versiones. run.py exporta app = create_app(). app/__init__.py carga Config, inicializa extensiones, registra ocho blueprints y añade /healthz y el manejador 429.

Google Sheets es la persistencia compartida. AppSheet accede directamente a la misma información; no hay en el repositorio un cliente AppSheet que pase por la API Flask. WordPress es la página comercial y punto de entrada previsto; no es el backend del flujo de reservas. SMTP envía recuperación y confirmación. La traza identifica Apps Script para recordatorios y caché, pero su código y triggers no están en este repositorio ni fueron obtenidos en esta auditoría.
## Nomenclatura funcional y nombres internos

| Lenguaje de usuario | Código y hojas físicas |
| --- | --- |
| Reserva | prereserva, prereservas, detalle_prereserva |
| Pauta | reserva, reservas, detalle_reserva |

Estos nombres físicos se conservan. El historial de pautas usa /api/reservas/cliente/completo. Editar reservas usa /api/prereservas/cliente y /detalle. Los nombres de componentes Pre_Orden, Historial_Reservas y PrereservaContext son internos; no prueban que exista un concepto comercial adicional.
## Instalación y ejecución en desarrollo

Node y npm para el frontend, Python con pip y venv para Flask, una copia de BD_PrismaLed, credenciales de prueba y un buzón SMTP de pruebas. Esta auditoría utilizó Node 24.19.0 y Python 3.12; son versiones de la comprobación local, no una certificación del runtime de producción. Gunicorn se ejecuta en Linux, como en Render; en Windows se usa Flask para desarrollo.

Desde prisma-led-back, crear un entorno virtual y activarlo en PowerShell. Copiar .env.example a .env, completar los valores y crear la carpeta privada credentials. Habilitar Sheets API y Drive API en el proyecto de la cuenta de servicio, descargar su JSON fuera de Git y compartir el Sheet de pruebas con su client_email como editor. El código pide scopes de Sheets y Drive y abre el documento por ID.

```powershell
cd prisma-led-back
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
# Completar .env y el JSON privado antes de ejecutar
python run.py
```

Flask sirve http://127.0.0.1:5000 y /healthz. run.py activa debug solo bajo __main__; nunca se usa python run.py para producción. El import de Config exige MAIL_PORT incluso para el health local. La conexión a Sheets se crea de forma diferida cuando se solicita información.

En otra terminal, desde prisma-led-web:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Vite normalmente abre http://localhost:5173. Mantener ese mismo origen en FRONTEND_URL: 127.0.0.1 y localhost son orígenes diferentes. Configurar VITE_API_URL con el sufijo /api. Evitar un .env.local con localhost al construir para producción; usar la variable de producción de forma explícita.

```powershell
$env:VITE_API_URL = 'https://api.prismawall.com.co/api'
npm run build
npm run preview
```

Vite produce dist, incluyendo public/.htaccess. npm ci respeta package-lock.json; el backend tiene dependencias sin versiones fijadas y por ello dos instalaciones pueden resolver versiones diferentes. Capturar las versiones del servicio vigente antes de actualizar requirements.
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

## Organización del frontend

src/router/AppRouter.jsx define /, /auth/login, /auth/recovery y /auth/registro como públicas. /cliente tiene inicio, reserva, disponibilidad, editar-reserva, pre-visualizacion, pre-orden, pre-orden-doc e historial-reservas. /perfil/editar es privada. Una ruta desconocida activa ForceLogoutRedirect. La publicación cPanel requiere el fallback de public/.htaccess para que un acceso directo a esas rutas llegue a React.

Layout1 contiene autenticación, Layout2 el área cliente con perfil y salida, y Layout3 los formularios amplios de registro y perfil. AppDataContext carga en paralelo tarifas, pantallas, categorías, cliente y ciudades cuando hay identidad en localStorage. Login emite un evento storage para actualizar el contexto en la misma ventana. PrereservaContext conserva el estado de edición solo en memoria.

Las pantallas de resumen y edición reciben información en location.state; recargar o abrir directamente una URL de paso puede perderla. PrivateRoute decodifica el JWT y comprueba expiración básica; la seguridad real la aplica Flask verificando firma y pertenencia. No sustituir esas comprobaciones por una validación del navegador.

services/api.js usa VITE_API_URL y, sin override, https://api.prismawall.com.co/api en producción o http://localhost:5000/api en desarrollo. Adjunta Authorization Bearer desde localStorage, fija timeout de diez segundos y procesa 401 y 429. Reintenta 429 hasta tres veces con esperas crecientes; no distingue operaciones de lectura y escritura ni espera necesariamente a que termine la ventana de límite.

## Autenticación y recuperación

POST /api/auth/login busca el correo sin distinguir mayúsculas y valida password_hash con Werkzeug. El JWT incluye como identidad id_usuario y caduca a los 60 minutos; para clientes creados desde web, id_cliente es igual a id_usuario. El navegador guarda el token en localStorage. Salir lo elimina localmente; no existe lista de revocación en el código y un token emitido continúa válido hasta expirar.

POST /register escribe usuarios y clientes; admite rol y creado_por en el payload, con valores cliente y registro_web por defecto. Solo exige nombre, correo y contraseña en servidor; las validaciones comerciales completas están en el formulario. La comprobación de correo duplicado al registrar es sensible a mayúsculas, a diferencia del login. No hay transacción entre las escrituras de usuarios y clientes. Añadir ciudad se intenta después y su fallo no revierte la cuenta.

POST /recovery exige coincidencia exacta de correo, genera una contraseña de diez caracteres con random.choices, guarda el nuevo hash y envía correo. Si SMTP falla intenta restaurar el hash anterior. No impone expiración ni cambio obligatorio de la contraseña temporal y no revoca tokens vigentes. POST /refresh-token requiere un access token todavía válido y devuelve otro access token; no usa un refresh token independiente.

useSessionTimer reinicia su contador con mousemove, keydown y click y pregunta tras 60 minutos de inactividad. Esa actividad no extiende por sí sola la expiración JWT. Intentar refresh al llegar al minuto 60 puede fallar porque el token ya expiró. Es un hallazgo operativo de prioridad media, no una ampliación efectiva de sesión garantizada.

## Flujo de reservas y pautas

Reserva.jsx valida fecha, duración, categoría y aceptación de la condición EMCALI en navegador. Envía POST /reservas/disponibilidad; Disponibilidad.jsx vuelve a consultar al montar, agrupa por cilindro, permite selección manual o mágica y 20/40/60 segundos. La aceptación EMCALI no se almacena en el payload ni se aplica en servidor como una regla adicional.

Pre_Orden.jsx presenta el resumen y llama crear-completo o actualizar-completo. Crear escribe primero detalle_prereserva y luego prereservas, con estado pendiente y correo_enviado no. Si ocurre una excepción intenta borrar cabecera y detalles del UUID generado. No llama al validador de disponibilidad: ni el lock ni el rollback impiden sobreventa con una selección obsoleta o un payload alterado.

Editar comprueba pertenencia y llama validar_detalle_prereserva con las fechas nuevas. Actualiza A:H de la cabecera, conserva fecha_creacion, reinicia estado y correo_enviado y reemplaza detalles. Las columnas posteriores a H, como url_oc y banderas de aviso, quedan intactas. La operación no conserva una copia de los detalles para rollback ante fallos; no es atómica. El validador tampoco agrega entre sí detalles duplicados del mismo payload ni rechaza necesariamente códigos desconocidos.

Eliminar comprueba pertenencia y borra cabecera y detalles en orden inverso de filas. No ofrece restauración automática ni transacción. El endpoint detalle verifica pertenencia, pero toma categoria de detalles[0] global, lo que puede devolver otra categoría; hallazgo reproducido sin datos reales.

Pre_Orden_Doc consulta el cliente y pide envío de correo al montar. El backend usa un lock y correo_enviado para evitar reenvío habitual, pero actualmente no verifica pertenencia, acepta destinatario e importes del payload y puede enviar aun si el ID no existe. Si SMTP se completa y falla la actualización en Sheets, un nuevo intento puede duplicarlo. El frontend captura el error en consola y no garantiza que el usuario lo advierta.

La pauta se formaliza en AppSheet. La acción confirmar compone Confirmar data pauta, crear detalle reserva, borrar detalle prereserva y borrar prere. Copia id_prereserva a id_reserva y los detalles a detalle_reserva; conserva el vínculo técnico y elimina la reserva original. La web no tiene endpoint POST para crear o cancelar pautas ni endpoint para subir videos. El historial reconstruye pantallas y tarifas desde /reservas/cliente/completo y permite reutilizar una pauta.
## Reglas de capacidad y precios

Un cupo son 20 segundos. Cada pantalla tiene un ciclo de 60 segundos y puede alojar hasta tres cupos: 20, 40 o 60 segundos. La consulta cruza las hojas prereservas y reservas con sus detalles y traduce codigo_tarifa a duracion_seg. Los solapamientos usan límites inclusivos. La implementación suma los segundos de todas las campañas que se cruzan con el intervalo solicitado, aunque no coincidan entre sí; puede dar disponibilidad conservadora. No se debe reinterpretar esa conducta como una regla comercial aprobada.

La búsqueda web admite 1 a 52 semanas o 1 a 12 meses. Un mes se convierte en cuatro semanas; doce meses equivalen a 48 semanas. La fecha final se calcula como inicio más 7 multiplicado por semanas. No son meses de calendario. El backend de disponibilidad valida la duración 1 a 52; la creación no aplica esas mismas comprobaciones.

La categoría se restringe por cilindro cuando otro cliente tiene una reserva o pauta de la misma categoría en fechas que se solapan. El cliente que ya tiene esa categoría queda excluido de esa restricción respecto de sus propias campañas. Durante edición, la reserva propia se excluye del cálculo para no contarla dos veces. La selección mágica distribuye pantallas aptas entre cilindros; no garantiza la selección cuando no hay suficientes cupos.

| Cupos | Segundos | Normal por semana y pantalla | Diciembre por semana y pantalla |
| --- | --- | --- | --- |
| 1 | 20 | COP 1.450.000 | COP 2.000.000 |
| 2 | 40 | COP 2.900.000 | COP 4.000.000 |
| 3 | 60 | COP 4.350.000 | COP 6.000.000 |

Los valores normales proceden de tarifas!A1:D10 el 06/10/2026, códigos a, b y c. Pueden cambiar por gestión comercial. Diciembre está fijado en el frontend y en el correo backend a COP 2.000.000 por cupo. Una semana se trata como diciembre si su primer o séptimo día cae en diciembre. La ventana semanal de precio usa inicio hasta inicio más seis días; la fecha_fin de disponibilidad usa inicio más siete días por semana. Esa diferencia en el límite debe preservarse y revisarse antes de cualquier cambio.

| Duración total | Descuento sobre semanas fuera de diciembre |
| --- | --- |
| Hasta 13 semanas inclusive | 0 % |
| Más de 13 y hasta 26 inclusive | 3,5 % |
| Más de 26 semanas | 10 % |

Subtotal por pantalla = tarifa normal por semanas normales por (1 menos descuento), más COP 2.000.000 por cupos por semanas de diciembre. Se suman pantallas y se calcula IVA = Math.round(subtotal por 0,19). Total = subtotal más IVA. Diciembre no recibe descuento. El IVA del 19 % se documenta como constante del código, no como asesoría tributaria.

Ejemplo de código: una pantalla, un cupo, una semana totalmente en diciembre da COP 2.000.000 de subtotal, COP 380.000 de IVA y COP 2.380.000 total. Una semana normal de un cupo da COP 1.450.000, COP 275.500 y COP 1.725.500. Los umbrales estrictos implican que 13 semanas no tienen descuento, 14 sí, 26 mantienen 3,5 % y 27 aplican 10 %.

Fuentes de cálculo: src/hooks/useResumenReserva.js, src/pages/Disponibilidad.jsx y app/routes/prereservas.py. El servidor no conserva un importe histórico en prereservas ni detalle_prereserva y acepta importes del navegador para el correo. Las consultas reconstruyen valores con las tarifas actuales; no equivalen a un registro financiero inmutable. Las fechas ISO sin hora se interpretan con Date y operaciones locales; requieren regresión en zonas horarias antes de modificar esta lógica.

## Persistencia y modelo físico

connect_sheet usa Credentials.from_service_account_file, gspread.authorize y open_by_key. _cached_spreadsheet reutiliza la conexión por proceso; no es una caché de todas las filas. Las funciones get_* suelen leer get_all_records completos. La fila 1 contiene encabezados, y los cálculos de fila agregan dos al índice del registro. No insertar encabezados intermedios, reordenar columnas posicionales o cambiar claves sin revisar API y AppSheet.

Las relaciones están en IDs y referencias AppSheet, no en constraints de una base SQL. clientes.id_cliente referencia usuarios.id_usuario; clientes.ciudad usa ciudades.nombre_ciudad. prereservas y reservas referencian clientes. Sus detalles enlazan cabecera, pantalla, categoría por nombre y tarifa por código. videos se conecta con detalle_reserva mediante video_detalle_reserva; facturacion referencia reservas. costos_operativos y reportes no tienen una relación externa inventada en esta edición.

UXID es un consecutivo visible calculado como máximo más uno; UUID truncado a ocho caracteres es la clave técnica. generate_next_uxid libera su lock antes de la escritura; el número puede competir con AppSheet u otro proceso. _ensure_column_and_get_index crea uxid si falta. Mantener una única instancia no sincroniza las escrituras externas de AppSheet.

El Sheet declara locale es_ES y timeZone America/Los_Angeles; el backend usa datetime.now sin zona explícita y la web fechas Date locales. Se documenta la diferencia sin cambiar la configuración. _prereservas_cache está oculta y se identifica en la traza como apoyo a Apps Script. _Per User Settings pertenece a AppSheet y no es una hoja física.

## Diccionario de hojas comprobado

### usuarios

Encabezados en orden físico: id_usuario, nombre, correo, telefono, rol, password_hash, fecha_creacion, Creado_por, uxid.

### clientes

Encabezados en orden físico: id_cliente, razon_social, nit, correo_electronico, ciudad, direccion, telefono_contacto, nombre_contacto, uxid.

### pantallas

Encabezados en orden físico: id_pantalla, cilindro, identificador, estado, observacion.

### _prereservas_cache

Encabezados en orden físico: id_prereserva, id_cliente, fecha_inicio, fecha_fin, estado, fecha_creacion, correo_enviado, uxid, url_oc, aviso_3d_enviado, aviso_1d_enviado, aviso_vencimiento_enviado. Hoja oculta.

### reservas

Encabezados en orden físico: id_reserva, id_cliente, fecha_inicio, fecha_fin, estado, fecha_creacion, uxid, url_oc.

### detalle_reserva

Encabezados en orden físico: id_detalle_reserva, id_reserva, id_pantalla, categoria, codigo_tarifa, uxid, video_cargado.

### prereservas

Encabezados en orden físico: id_prereserva, id_cliente, fecha_inicio, fecha_fin, estado, fecha_creacion, correo_enviado, uxid, url_oc, aviso_3d_enviado, aviso_1d_enviado, aviso_vencimiento_enviado.

### detalle_prereserva

Encabezados en orden físico: id_detalle_prereserva, id_prereserva, id_pantalla, categoria, codigo_tarifa, uxid.

### ciudades

Encabezados en orden físico: nombre_ciudad.

### videos

Encabezados en orden físico: id_video, referencia, url_archivo, uxid.

### video_detalle_reserva

Encabezados en orden físico: id_video_detalle_reserva, id_video, id_detalle_reserva, fecha_subida, fecha_bajada, uxid.

### facturacion

Encabezados en orden físico: id_factura, id_reserva, fecha_factura, valor, valor_pagado, fecha_pago, estado, metodo, uxid, url_fact.

### costos_operativos

Encabezados en orden físico: id_costo, tipo, descripcion, valor, fecha, uxid.

### tarifas

Encabezados en orden físico: codigo_tarifa, descripcion, duracion_seg, precio_semana.

### reportes

Encabezados en orden físico: id_reporte, tipo, periodo, fecha_generacion, descripcion, uxid.

### categorias

Encabezados en orden físico: nombre.

## Catálogo de endpoints

Todas las rutas son relativas al dominio API. JWT Sí significa @jwt_required; no implica un control de rol. OPTIONS explícito o automático soporta preflight. /healthz solo confirma que Flask responde y no valida Sheets o SMTP.

| Método | Ruta | JWT |
| --- | --- | --- |
| GET | /healthz | No |
| POST | /api/auth/login | No |
| POST | /api/auth/register | No |
| POST | /api/auth/recovery | No |
| POST | /api/auth/refresh-token | Sí |
| GET | /api/categorias | Sí |
| POST | /api/categorias | Sí |
| GET | /api/ciudades | No |
| POST | /api/ciudades | Sí |
| PUT | /api/cliente | Sí |
| GET | /api/cliente | Sí |
| GET | /api/pantallas | Sí |
| GET,OPTIONS | /api/prereservas/cliente | Sí |
| GET | /api/prereservas/detalle/<id_reserva> | Sí |
| POST | /api/prereservas/enviar-correo | Sí |
| DELETE | /api/prereservas/<id_prereserva> | Sí |
| POST | /api/prereservas/crear-completo | Sí |
| PUT | /api/prereservas/actualizar-completo/<id_prereserva> | Sí |
| POST | /api/reservas/disponibilidad | Sí |
| GET | /api/reservas/tarifas | Sí |
| GET,OPTIONS | /api/reservas/cliente | Sí |
| GET | /api/reservas/cliente/completo | Sí |
| GET | /api/tarifas | Sí |

Los GET de maestros devuelven listas; GET ciudades devuelve nombres. Login devuelve token, usuario y correo. Registro devuelve msg. Disponibilidad devuelve un objeto por ID de pantalla con estado, mensaje, cilindro, identificador y segundos_disponibles. Crear completo devuelve id_prereserva y uxid. El detalle devuelve el campo legacy id_reserva aunque la entidad sea una prereserva. Los errores pueden usar msg o error; respetar esa heterogeneidad al integrar clientes.

Ejemplo de consulta protegida: POST /api/reservas/disponibilidad con fecha_inicio ISO, duracion_semanas entero y categoria por nombre. excluir_prereserva_id se usa en edición. Crear y actualizar reciben fecha_inicio, fecha_fin, categoria y pantallas con id_pantalla y cod_tarifas. La edición recibe uxid; no asumir que el servidor lo recalcula ni lo preserva si el cliente lo altera.

## Límites locks y reintentos

| Operación | Límite por IP configurado |
| --- | --- |
| Login | 10 por minuto |
| Registro | 5 por minuto |
| Recuperación | 3 por hora |
| Refresh | 20 por minuto |
| GET ciudades | 10 por minuto |
| POST ciudades | 3 por minuto |
| PUT perfil | 5 por minuto |
| Disponibilidad | 5 por minuto |
| Tarifas desde reservas | 20 por minuto |
| Rutas sin límite específico | 200 por día y 50 por hora |

Los valores 200 y 50 están en default_limits, no en application_limits. Por defecto, un limit explícito sustituye los defaults y las cuotas se identifican por endpoint e IP; no son un techo global combinado para toda la API. Semántica contrastada con la API oficial de Flask-Limiter: https://flask-limiter.readthedocs.io/en/stable/api.html.

No se define storage_uri: los contadores viven en memoria y se reinician con el proceso. key_func usa get_remote_address; no hay ProxyFix en la fábrica. La IP que realmente ve Render detrás de proxies debe comprobarse antes de atribuir una cuota independiente a cada visitante.

registro_lock protege alta; recovery_lock recuperación; pre_reserva_lock creación, edición, eliminación y confirmación; detalle_pre_reserva_lock se combina en edición; ciudad_lock protege POST ciudades. Son threading.Lock del proceso, sin coordinación con AppSheet. Conservar un worker y una instancia hasta evaluar almacenamiento compartido y estrategia de bloqueo distribuido. Redis es una mejora de escalabilidad, no una migración autorizada en este cierre.

retry_on_rate_limit captura googleapiclient.errors.HttpError 429, 500 y 503, con cinco intentos y backoff exponencial más jitter. Las llamadas principales son gspread, que puede lanzar APIError; no afirmar que todos los errores de Sheets quedan cubiertos. El DELETE decorado puede además plantear reintentos después de una escritura parcial. Registrar y revisar, sin implementar un cambio funcional.

## Seguridad pruebas y mantenimiento

El árbol actual no mostró patrones de claves privadas ni tokens conocidos en el escaneo; .gitignore excluye .env, variantes y credentials. Esto no certifica todo el historial ni los secretos del servicio. No publicar JSON de servicio, hashes, registros de clientes o logs con tokens. Las búsquedas de nombres de archivos sensibles en el historial no son un detector exhaustivo de credenciales.

La auditoría compila el frontend, analiza sintaxis Python, comprueba health, CORS y JWT local y ejecuta casos de precio. Los hallazgos funcionales se reproducen con mocks de Sheets y SMTP. No hay suite versionada ni pruebas de carga vigentes. npm audit reporta 25 paquetes con alertas contando desarrollo, siete al omitir dev; no acredita explotación en la aplicación. Las dependencias de backend instaladas hoy no prueban cuáles ejecuta Render.

La operación y el rollback están detallados en 04_Despliegue_operacion. Para una incidencia, conservar hora, referencia PW, endpoint y código HTTP, sin token. Consultar logs Render y la hoja pertinente con acceso autorizado. No reproducir el error con datos reales si basta una copia y servicios simulados. Consultar 05_Deuda_pendientes antes de recomendar el merge.
## Fuentes y límites de verificación

Código de Angelolozano-7/Prisma_Led, rama cierre-proyecto, commit d47a6ee2af98501a1bd168ac93bac57b2d948d0d, consultado el 6 de octubre de 2026. Las rutas y reglas descritas corresponden a esta revisión; no se obtuvo el SHA desplegado en Render ni el manifiesto de la publicación cPanel.

BD_PrismaLed, cuenta Drive Bulevar: se verificaron metadatos, encabezados de las 16 hojas y tarifas. No se exportaron datos de clientes, contraseñas ni credenciales. Diagrama ER-PRISMA-FINAL.png contrastado con la estructura física. Documentación AppSheet del 30/09/2026 y los turnos disponibles de Fase de cierre proyecto y Desarrollo módulo administrativo. La herramienta solo entregó cinco turnos recientes del chat de cierre y no ofreció paginación; no se afirma haber leído su historial completo.

Las instrucciones del propietario acreditan el despliegue y una prueba satisfactoria del flujo funcional completo. Esa declaración se distingue de las pruebas nuevas de esta auditoría. La propuesta, cronograma, preguntas, requisitos, historias General/M1/M2 y prisma-led.zip no se localizaron en las fuentes accesibles; faltan para cerrar trazabilidad contractual completa. La presentación comercial de 2025 se revisó como referencia histórica; sus cifras no sustituyen el código ni las tarifas actuales.
