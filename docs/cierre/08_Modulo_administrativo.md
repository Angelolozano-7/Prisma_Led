# Módulo administrativo de PRISMALED

Esta guía explica la operación interna documentada en AppSheet y su relación con la plataforma web. El propietario declaró terminado el módulo. Se revisó su exportación del 30/09/2026, versión 1.100030, con 16 tablas, 234 columnas, un slice, 76 vistas y 116 acciones. La exportación declara Runnable Yes y Deployable No; la entrega no certifica su deployment check ni los permisos de acceso vigentes.

## Acceso datos y sincronización

La aplicación BD_PrismaLed usa Google Sheets como fuente directa de las tablas operativas. _Per User Settings es una tabla interna por usuario y no una hoja física. _prereservas_cache existe en el Sheet y no está entre las tablas operativas exportadas de AppSheet. La web escribe reservas en prereservas y detalle_prereserva; la administración las recibe al sincronizar su fuente.

No se obtuvo un enlace oficial de acceso AppSheet desde la documentación exportada; el responsable debe entregar el enlace y accesos corporativos autorizados. No se infiere la política completa de roles por las descripciones del proyecto. Hay acciones cuya condición consulta USEREMAIL y rol admin, pero eso no certifica seguridad global de todas las tablas y vistas.

## Resumen y periodo

Resumen reúne DT_Resumen, Estado pantallas, Histograma de reservas e Histograma de pautas. Las guías definen pantallas reservadas y ocupadas como cantidad de pantallas únicas del periodo, no como número de cupos vendidos. También muestra averiadas, disponibles, ingresos y costos operativos.

Cambiar fechas abre Settings para Año de inicio, Mes de inicio, Año fin y Mes fin. Los meses se expresan de uno a doce. Para consultar un mes, ponga el mismo mes y año al inicio y fin; para un intervalo, seleccione los extremos y guarde. Las fórmulas de periodo usan el primer día del mes inicial y el último del mes final y ordenan extremos si se invierten. La ayuda Mostrar instrucciones y ayuda_periodo están respaldadas por la traza y exportación; no son una vista de negocio adicional.

## Reservas y formalización de pautas

En Reservas revise cliente, fechas, pantallas, duración, importe estimado y orden de compra. Cargar OC permite adjuntar url_oc y el flujo establece estado ok. La acción confirmar está condicionada a estado ok y compone la copia de cabecera y detalles a las tablas de pautas y el borrado de la reserva original.

Confirmar data pauta copia id_prereserva a id_reserva, fechas, cliente, fecha de creación y url_oc, con estado pendiente. crear_detalle_reserva copia identificadores de detalle, pantalla, categoría, código de tarifa y video_cargado FALSE. Después se borran detalles y cabecera de prereserva. Revisar los datos antes de aceptar la confirmación: una secuencia de acciones no es una transacción y puede requerir conciliación si la sincronización falla.

La guía de Reservas indica vigencia limitada y recordatorios. La descripción histórica habla de diez días de bloqueo y el correo web solicita video en cinco días; no se unifican esos plazos. No se obtuvo Apps Script para certificar la ejecución exacta de vencimientos, avisos o borrados, por lo que el responsable debe contrastar los triggers antes de recibir ese servicio.

En Pautas consulte el cliente, fechas, pantallas, estado de facturación y material. Las acciones facturar, pagar, marcar pagado, marcar pendiente y anular aparecen en la exportación. Antes de alterar una pauta verifique la factura y video relacionados. La web muestra el historial de esas pautas, pero no las crea ni cancela directamente.

## Pantallas y transmisión

Pantallas identifica cada cilindro y cara, distingue estado físico activa o averiada y permite observaciones. Las acciones pantalla averiada y Arreglar pantalla registran el ciclo de mantenimiento. El estado físico es distinto del estado comercial reservado u ocupado. La API de disponibilidad no filtra ese campo físico actualmente; documentado como DT13 para revisión.

Transmisión gestiona el material asociado a los detalles de pauta mediante video_detalle_reserva. Compruebe el video, la pantalla de la pauta y fechas de subida y bajada. La expresión Valid_If del detalle de video impide asociar el mismo id_detalle_reserva a otro registro de transmisión. Subir video detalle, bajar video detalle y sus acciones relacionadas están documentadas. Esta aplicación gestiona archivos y relaciones; no se acreditó una integración automática con el hardware reproductor desde el repositorio.

Videos mantiene referencia y url_archivo. Un archivo registrado no demuestra por sí solo que esté asignado a una pauta o transmitiéndose. Antes de reemplazar o eliminar videos revise su vínculo de transmisión. Los archivos de videos, órdenes y facturas viven en carpetas de Drive de la aplicación; no son binarios almacenados en las celdas.

## Contabilidad y costos

Contabilidad usa facturacion, vinculada a id_reserva. Revise fecha, valor, valor_pagado, fecha_pago, estado, método y url_fact. La guía distingue pendiente, pagado y anulado. Registrar un pago requiere información del pago real; la documentación no acredita una conexión bancaria ni emisión automática en Siigo aunque un identificador pueda usarse como referencia de factura.

Costos operativos registra tipo, descripción, valor y fecha. La fecha determina el periodo en el resumen y deben evitarse duplicados. Las métricas administrativas se calculan con columnas virtuales; la web no presenta un módulo contable al cliente.

## Usuarios tarifas analítica y ayudas

Usuarios muestra identidad, contacto y rol; modificarlo exige autorización administrativa. Tarifas mantiene código, descripción, duración y precio_semana. Cambiar una tarifa puede afectar cálculos reconstruidos de reservas y pautas existentes, porque el modelo físico no conserva el precio por detalle como una instantánea histórica. Revisar implicaciones antes de editar.

La exportación contiene la acción Abrir analitica; no se identificó una vista independiente llamada Analítica en el catálogo de 76 vistas. Debe describirse como acción y no inventar un tablero adicional. Resumen incluye histogramas y la vista Estado pantallas respaldados por la fuente.

Guia_Resumen, Guia_Pautas, Guia_Reservas, Guia_Pantallas, Guia_Transmision, Guia_Contabilidad, Guia_Usuarios, Guia_Costos_Operativos, Guia_Videos y Guia_Tarifas se basan en SL_Guias y columnas virtuales guia_* en usuarios. Los botones de ayuda abren instrucciones contextuales y no escriben información comercial. La guía de periodo usa User Settings.

## Entrega y conservación

Conservar la exportación de configuración, el acceso AppSheet, licencia y deployment check, el Sheet, carpetas de adjuntos y Apps Script con triggers. No renombrar hojas, columnas ni IDs. Ante fallos de formalización, revisar cabecera y detalles de ambos estados antes de repetir una acción que podría duplicar pauta. Los locks del backend no protegen cambios administrativos.

La guía funcional se apoya en las columnas y acciones reales; no ejecutó una nueva confirmación, pago o borrado. Faltan evidencia de habilitación formal, revisión global de permisos, scripts y trazabilidad de aceptación para cerrar la entrega operativa del módulo sin reservas.
## Nomenclatura funcional y nombres internos

| Lenguaje de usuario | Código y hojas físicas |
| --- | --- |
| Reserva | prereserva, prereservas, detalle_prereserva |
| Pauta | reserva, reservas, detalle_reserva |

Estos nombres físicos se conservan. El historial de pautas usa /api/reservas/cliente/completo. Editar reservas usa /api/prereservas/cliente y /detalle. Los nombres de componentes Pre_Orden, Historial_Reservas y PrereservaContext son internos; no prueban que exista un concepto comercial adicional.
## Fuentes y límites de verificación

Código de Angelolozano-7/Prisma_Led, rama cierre-proyecto, commit d47a6ee2af98501a1bd168ac93bac57b2d948d0d, consultado el 6 de octubre de 2026. Las rutas y reglas descritas corresponden a esta revisión; no se obtuvo el SHA desplegado en Render ni el manifiesto de la publicación cPanel.

BD_PrismaLed, cuenta Drive Bulevar: se verificaron metadatos, encabezados de las 16 hojas y tarifas. No se exportaron datos de clientes, contraseñas ni credenciales. Diagrama ER-PRISMA-FINAL.png contrastado con la estructura física. Documentación AppSheet del 30/09/2026 y los turnos disponibles de Fase de cierre proyecto y Desarrollo módulo administrativo. La herramienta solo entregó cinco turnos recientes del chat de cierre y no ofreció paginación; no se afirma haber leído su historial completo.

Las instrucciones del propietario acreditan el despliegue y una prueba satisfactoria del flujo funcional completo. Esa declaración se distingue de las pruebas nuevas de esta auditoría. La propuesta, cronograma, preguntas, requisitos, historias General/M1/M2 y prisma-led.zip no se localizaron en las fuentes accesibles; faltan para cerrar trazabilidad contractual completa. La presentación comercial de 2025 se revisó como referencia histórica; sus cifras no sustituyen el código ni las tarifas actuales.
