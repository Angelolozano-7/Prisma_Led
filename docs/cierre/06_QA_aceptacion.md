# Pruebas y aceptación de PRISMALED

El sistema fue declarado desplegado y probado por el propietario. Este checklist consolida esa declaración y las comprobaciones nuevas, sin confundir una revisión de código con una ejecución funcional completa. Los hallazgos reproducidos invalidan una aceptación técnica incondicional. No se modificó producción ni se repitieron altas, recuperaciones, confirmaciones o eliminaciones con datos reales.

## Criterio de estados

YA VALIDADO indica una comprobación actual satisfactoria o una validación reportada por el propietario, identificada en la columna de evidencia. PENDIENTE indica falta de evidencia individual, una comprobación no ejecutada o una falla abierta. NO APLICA se reserva para funciones fuera del sistema auditado. Reportado no significa reejecutado.

| Caso | Estado | Evidencia y límite |
| --- | --- | --- |
| Frontend producción | YA VALIDADO | GET / y /auth/login devolvieron 200 por HTTPS el 06/10/2026. No certifica toda la UI. |
| Backend producción y API | YA VALIDADO | GET /healthz 200; no comprueba Sheets ni SMTP. |
| HTTPS | YA VALIDADO | Solicitudes TLS verificadas a ambos dominios; panel DNS y política completa pendientes. |
| Login | YA VALIDADO | Flujo completo declarado probado por propietario; JWT obligatorio comprobado localmente. |
| Registro general | YA VALIDADO | Incluido en declaración funcional global; sin nueva alta real. |
| Registro ciudad existente | PENDIENTE | Código revisado; falta evidencia individual en traza disponible. |
| Registro ciudad nueva | PENDIENTE | Código añade ciudad; falta evidencia individual y prueba de catálogo posterior. |
| Recuperación | YA VALIDADO | Flujo reportado; rollback SMTP revisado en código, no envío nuevo. |
| Perfil | YA VALIDADO | Flujo reportado; validación y persistencia revisadas. |
| Creación reserva habitual | YA VALIDADO | Declaración de flujo completo; no acredita resistencia a concurrencia. |
| Fechas pantallas cupos | YA VALIDADO | Flujo reportado y revisión de controles del código. |
| Precios y descuentos | YA VALIDADO | Ocho comprobaciones locales: cuatro en UTC y cuatro en Bogotá. No compara AppSheet completo. |
| Diciembre 20 40 60 | YA VALIDADO | Subtotales 2, 4 y 6 millones e IVA comprobados con función real. |
| Edición habitual | YA VALIDADO | Reportada en flujo global; DT04 y fallos parciales quedan abiertos. |
| Confirmación habitual | YA VALIDADO | Flujo reportado; validación de propietario falló en mocks, ver DT01. |
| Eliminación habitual | YA VALIDADO | Flujo reportado; no se repitió sobre producción. |
| Persistencia Sheets | YA VALIDADO | Encabezados y tarifas actuales consultados; guardado funcional reportado. |
| CORS de producción | PENDIENTE | CORS local válido; requiere preflight de producción con origen exacto y origen no permitido. |
| Rutas React | YA VALIDADO | /auth/login directo 200; otras rutas y navegación privada pendientes de revisión visual. |
| Responsive | PENDIENTE | Clases adaptativas revisadas; capturas fiables no obtenidas en esta sesión. |
| Correo habitual | YA VALIDADO | Propietario declara flujo completo; entrega real no reejecutada. |
| Reserva ajena y correo | PENDIENTE | DT01 reproducido: endpoint acepta propietario distinto en simulación. |
| Creación fuera de capacidad | PENDIENTE | DT03 reproducido: dos detalles 60s misma pantalla aceptados. |
| Categoría propia en detalle | PENDIENTE | DT04 reproducido: devuelve categoría de otra fila. |
| POST categorías compatible | PENDIENTE | DT05 reproducido contra esquema real confirmado. |
| Fallo parcial de edición y registro | PENDIENTE | Integridad necesita pruebas sobre mocks o copia y corrección autorizada. |
| Formalización AppSheet | PENDIENTE | Acciones revisadas; ejecución no repetida y exportación Deployable No. |
| Apps Script y avisos | PENDIENTE | No se obtuvieron código ni triggers. |
| WordPress comercial | PENDIENTE | PENDIENTE DE VALIDACIÓN DEL CLIENTE. |
| Merge main tag y release | PENDIENTE | Requieren autorización; no ejecutados. |
| Redis y varias instancias | NO APLICA | Mejora futura fuera del cierre autorizado. |
| Pago en línea o carga de video web | NO APLICA | No hay implementación en el módulo web auditado. |

## Pruebas nuevas ejecutadas

El frontend completó transformación de 1808 módulos con Vite 4.5.14; dist incluyó .htaccess y el dominio API definitivo. npm run build estándar falló por EPERM realpath de este entorno Windows. La comprobación alternativa usó preserveSymlinks en una configuración temporal, desde la carpeta frontend; el repositorio no fue modificado para sortear el entorno. No se certifica una compilación estándar en la máquina del mantenedor.

Se instalaron las dependencias backend en una carpeta aislada y se analizó sintaxis de todos los módulos Python. Flask test_client verificó /healthz local, 401 de ruta protegida sin token y CORS local. Sheets y SMTP fueron reemplazados por mocks para las cuatro reproducciones de DT01, DT03, DT04 y DT05. Cero altas, mensajes y cambios de producción durante estas pruebas.

Precios: 20/40/60 segundos de diciembre, umbrales 13/14/26/27 semanas, una semana que empieza el 30 de noviembre y descuento solo fuera de diciembre. Se ejecutaron en UTC y America/Bogota usando la función real useResumenReserva. Los resultados se conservan en evidencias resumidas del paquete. No equivalen a revisar toda combinación de fecha, duración o redondeo ni todas las fórmulas administrativas.

npm audit registró siete paquetes con avisos de ejecución y 25 incluyendo herramientas de desarrollo. Se trata de alertas del inventario, sin ataque a producción ni actualización de dependencias. El escaneo de patrones de secretos en el árbol actual encontró cero coincidencias; no acredita todo el historial.

## Aceptación necesaria después de autorizar correcciones

1. DT01: cliente A frente a reserva de B o ID inexistente debe obtener rechazo sin correo y sin actualizar Sheet; destinatario e importe no deben confiar en el payload.
2. DT03: dos creaciones concurrentes que excedan capacidad deben dejar solo la primera válida; códigos desconocidos y detalles duplicados deben rechazarse sin filas parciales.
3. DT04: con reservas de distintas categorías, cada detalle debe devolver su categoría y conservarla al editar.
4. DT05: crear una categoría válida debe escribir exclusivamente el esquema nombre y mantener lectura AppSheet.
5. Con datos de prueba autorizados, confirmar registro con ciudad existente y nueva, recuperación, perfil, edición, confirmación, entrega de correo y eliminación. Asociar captura o log redactado a cada resultado.
6. Revisar móvil y escritorio, recarga de rutas y CORS de origen autorizado y no autorizado. Comprobar habilitación AppSheet, triggers Apps Script y revisión de avisos de dependencias.

La aceptación empresarial debe registrar responsable que entrega, quien recibe, fecha, versión, reservas de aceptación y compromiso sobre pendientes. Esos campos no están firmados en esta edición. El checklist puede recibirse como documentación; no se sustituye una firma por la afirmación del auditor.
## Fuentes y límites de verificación

Código de Angelolozano-7/Prisma_Led, rama cierre-proyecto, commit d47a6ee2af98501a1bd168ac93bac57b2d948d0d, consultado el 6 de octubre de 2026. Las rutas y reglas descritas corresponden a esta revisión; no se obtuvo el SHA desplegado en Render ni el manifiesto de la publicación cPanel.

BD_PrismaLed, cuenta Drive Bulevar: se verificaron metadatos, encabezados de las 16 hojas y tarifas. No se exportaron datos de clientes, contraseñas ni credenciales. Diagrama ER-PRISMA-FINAL.png contrastado con la estructura física. Documentación AppSheet del 30/09/2026 y los turnos disponibles de Fase de cierre proyecto y Desarrollo módulo administrativo. La herramienta solo entregó cinco turnos recientes del chat de cierre y no ofreció paginación; no se afirma haber leído su historial completo.

Las instrucciones del propietario acreditan el despliegue y una prueba satisfactoria del flujo funcional completo. Esa declaración se distingue de las pruebas nuevas de esta auditoría. La propuesta, cronograma, preguntas, requisitos, historias General/M1/M2 y prisma-led.zip no se localizaron en las fuentes accesibles; faltan para cerrar trazabilidad contractual completa. La presentación comercial de 2025 se revisó como referencia histórica; sus cifras no sustituyen el código ni las tarifas actuales.
