# Deuda técnica y pendientes de PRISMALED

La documentación puede entregarse, pero la auditoría no recomienda todavía el merge final ni declarar aceptación técnica sin reservas. Hay hallazgos reproducidos de autorización y asignación de capacidad. Las propuestas siguientes son concretas y requieren autorización antes de cambiar comportamiento funcional; este cierre no las implementa.

## Crítico

DT01 Confirmación sin pertenencia. app/routes/prereservas.py, enviar_correo_prereserva, busca por ID pero no compara id_cliente con get_jwt_identity. Con un JWT local de cliente A, un registro simulado de B y SMTP simulado, la llamada devolvió 200, envió el mensaje y permitió actualizar correo_enviado. No se probó sobre producción ni sobre registros reales.

Impacto: un cliente puede generar correos asociados a una reserva ajena y alterar su marca de envío; además destinatario, identidad comercial y precios llegan del payload. El endpoint puede enviar con un ID inexistente. Propuesta: exigir existencia y propietario antes de cualquier envío, obtener destinatario, detalles y precios en servidor, y devolver 404 sin escritura ni SMTP si no corresponde. Aceptación: cliente A no puede confirmar B o ID inexistente; tampoco cambiar correo o total mediante payload; la confirmación legítima se conserva y su política de reintentos queda explícita.

DT02 Alerta crítica en dependencia. npm audit identifica form-data dentro de dependencias de ejecución con severidad crítica del registro. La alerta GHSA-fjxv-7rqg-78g4 afecta versiones anteriores a 4.0.4 de la serie 4 y describe la generación de límites multipart; su explotación depende de condiciones concretas. Fuente primaria: https://github.com/advisories/GHSA-fjxv-7rqg-78g4. La web usa Axios en navegador y no se demostró que el adaptador Node vulnerable forme parte de una ruta explotable en producción. Prioridad de análisis urgente, sin afirmar compromiso. Propuesta: revisar alcanzabilidad de cada aviso y preparar actualización controlada del lockfile con regresión; no ejecutar npm audit fix por fuerza.

## Alto

DT03 Crear no revalida capacidad. crear_prereserva_completa guarda los detalles sin comprobar solapamiento, categoría, IDs de pantalla y tarifa ni duplicados. Un payload simulado con dos detalles de 60 segundos para la misma pantalla devolvió 201. El lock serializa escrituras del proceso, pero no vuelve a validar una selección que quedó desactualizada. Impacto: sobreasignación y ruptura de reglas desde un payload alterado o una carrera de clientes. Propuesta: validar el conjunto agregado y la disponibilidad vigente dentro de la sección crítica antes de cualquier escritura. Mantener 60 segundos, diciembre y descuentos. Aceptación: el segundo guardado incompatible recibe 409 y no deja cabecera ni detalles; desconocidos y duplicados se rechazan coherentemente.

DT04 Categoría errónea al leer detalle. obtener_detalle_reserva obtiene las pantallas de la reserva propia, pero devuelve la categoría de detalles[0] global. Se reprodujo la devolución de otra categoría con mocks. Impacto: el flujo de edición puede cambiar la categoría comercial o mostrar información ajena. Propuesta: filtrar primero los detalles por id_prereserva y tomar la categoría solo de ese conjunto, manejando ausencia e inconsistencias. Aceptación: dos reservas de categorías diferentes devuelven su categoría propia y la edición la conserva.

DT05 Categorías incompatibles con Sheets. POST /api/categorias añade [nuevo_id, nombre]; la hoja real solo tiene encabezado nombre, usado como clave en ER y AppSheet. Se comprobó la escritura de dos valores con un mock. El primer valor quedaría bajo nombre y el segundo bajo una columna sin encabezado. Impacto: catálogo malformado e incompatibilidad con AppSheet; la web no consume este POST en su flujo normal. Propuesta: adaptar el endpoint al esquema confirmado sin renombrar hojas, comprobar duplicados y quién puede modificar el maestro. Aceptación: el nombre queda en A y no se crea una columna de datos sin encabezado.

DT06 Integridad sin transacciones. El registro puede dejar usuario sin cliente si falla la segunda escritura. Editar actualiza la cabecera, borra detalles y añade nuevos sin restauración ante fallo. Eliminar borra cabecera antes de los detalles. AppSheet formaliza pauta mediante varias acciones de copiar y borrar. Impacto: registros huérfanos o reserva incompleta. No se provocaron fallos contra datos reales. Propuesta: snapshots, compensación y reconciliación sobre copia, con pruebas de fallo por fase y una estrategia coordinada con AppSheet; no basta aumentar workers.

DT07 Validación y rol de registro. El servidor solo exige tres campos, admite rol/creado_por del payload y compara correos duplicados con mayúsculas sensibles. La interfaz valida más campos, pero una solicitud directa la evita. Impacto: datos inválidos, identidad duplicada o rol no esperado en la hoja compartida. No se demostró un privilegio administrativo concreto adquirido en AppSheet. Propuesta: fijar el rol público a cliente, normalizar duplicados y validar campos en servidor con las reglas vigentes aprobadas; revisar cualquier dependencia administrativa antes de aplicar.

DT08 Dependencias con avisos altos. npm audit --omit=dev reporta siete paquetes: una severidad crítica, tres altas, dos moderadas y una baja; el análisis completo reporta 25. Incluye Axios y React Router. La severidad del registro no equivale a exploit demostrado; varios avisos se refieren al adaptador Node o al modo framework que esta SPA no usa. Propuesta: inventario de versiones, evaluación de alcanzabilidad, actualización acotada y pruebas; no refactorizar la aplicación durante el cierre documental.

## Medio

DT09 Escalabilidad y escrituras externas. Flask-Limiter y threading.Lock son locales. Un worker declarado reduce competencia interna, pero AppSheet y Apps Script comparten el Sheet sin esos locks. UXID libera su lock antes de persistir. Evaluar Redis, coordinación de IDs, bloqueos distribuidos y límites compartidos antes de varios workers o instancias. Es deuda condicionada al crecimiento; no se implementa ahora.

DT10 Sesión y renovación. JWT y aviso están en 60 minutos, pero uno cuenta desde emisión y otro desde actividad. El refresh exige token no vencido. Propuesta: renovar antes de expirar o mejorar el aviso y manejo de sesión, con regresión de actividad y expiración. La sesión actual puede requerir volver a entrar aunque el usuario pulse continuar.

DT11 Correo después de guardado. La pantalla final captura en consola el fallo de envío sin un estado visible fiable. SMTP puede completarse y fallar correo_enviado, permitiendo duplicados. La bandera se reinicia al editar, que es comportamiento actual, no bug por sí solo. Propuesta: estado visible, fuente de datos servidor e idempotencia de envío, sin convertir un fallo de SMTP en una segunda reserva.

DT12 Sheets filas y fechas. get_all_records, int, strptime y .strip asumen tipos y encabezados. gspread puede lanzar APIError no capturado por el retry de HttpError. Se observan diferencias de zona entre Sheet, servidor y navegador y límites inclusivos de disponibilidad frente a ventanas de precio. Propuesta: validación de esquema y manejo controlado de filas inválidas, regresión de fechas y errores reales de librería. No cambiar zonas o límites sin aceptación comercial.

DT13 Pantallas averiadas y estados. La consulta de disponibilidad no utiliza el campo estado físico de pantallas ni filtra estado de cada cabecera. Los indicadores administrativos sí distinguen averiadas. No se comprobó una avería vigente ni un registro cancelado bloqueando capacidad. Revisar el comportamiento deseado y comprobar con copia antes de cambiarlo. La suma de todos los solapamientos también puede subestimar capacidad cuando las campañas no se solapan entre ellas.

DT14 AppSheet y automatizaciones. La exportación declara Runnable Yes y Deployable No. El módulo fue declarado terminado por el propietario; no se certifica su habilitación formal ni licencia. Apps Script, triggers y código de recordatorios no se obtuvieron. Propuesta: revisión de deployment check, seguridad, cuentas, scripts y triggers con evidencia, sin reconstruir el módulo.

DT15 Dependencias backend y cuotas. requirements no fija versiones; falta inventario runtime de Render. Defaults 200/día y 50/hora son por endpoint y pueden ser sustituidos por limit explícito, no un límite global acumulado. La IP detrás de proxies y /healthz sujeto a cuota requieren confirmación operativa. Registrar versiones y procedimiento de monitoreo antes de escalar.

## Bajo

DT16 Nomenclatura legacy. Se conserva por compatibilidad y está documentada. Renombrarla exige migración coordinada con Sheets, AppSheet y automatizaciones. No es un error funcional de este cierre.

DT17 Recursos y espera artificial. Hay imágenes de cilindros de aproximadamente 24 a 30 MB y copias idénticas según hashes Git. El build deduplica varias, pero las tres imágenes emitidas suman unos 81 MB. Client_Home impone cinco segundos y Editar_Reserva tres de espera. Afecta experiencia y rendimiento; conservar archivos mientras se verifican usos y optimizar solo en un trabajo posterior autorizado.

DT18 Comentarios y pruebas históricas. El README menciona app/tests inexistente y despliegue futuro; se corrige documentalmente. api.js conserva un comentario antiguo de Render y se actualiza sin cambiar código ejecutable. useSessionTimer aludía a una revisión futura; se reemplaza por una explicación precisa del límite. No hay scripts k6 vigentes que certificar.

## Mejora futura

Roles y permisos explícitos en API, recuperación mediante token de un solo uso, revocación de sesión, historial económico inmutable, integración continua, prueba de carga sobre entorno de ensayo, observabilidad y evaluación de persistencia alternativa cuando el volumen lo justifique. Son recomendaciones; no se presentan como funcionalidades contratadas pendientes sin historias vigentes.

## Pendientes de cliente y entrega

WP01 Página prismawall.com.co/pantallas-led: PENDIENTE DE VALIDACIÓN DEL CLIENTE. Requiere aprobación de texto, fotografías, mapa, presentación o video y CTA a reservas.prismawall.com.co. No se publica contenido definitivo ni cifras nuevas. La presentación de 2025, fotografías y prototipo se conservan como referencias, no como aprobación.

ENT01 Conciliar propuesta, historias y cronograma no localizados. ENT02 Registrar rama, comandos, secretos sin valores, runtime, DNS y respaldos desde paneles. ENT03 Consolidar evidencia individual de QA que falta, transferencia de accesos y aceptación empresarial. ENT04 Autorizar correcciones DT01, DT03, DT04 y DT05 antes de recomendar main. Cada aceptación debe registrar responsable, fecha y evidencia; este documento no inventa asignaciones o firmas.
## Fuentes y límites de verificación

Fuentes: cierre-proyecto (d47a6ee2af98501a1bd168ac93bac57b2d948d0d), encabezados y tarifas de BD_PrismaLed en Drive Bulevar, ER-PRISMA-FINAL.png, exportación AppSheet del 30/09/2026, presentación comercial de 2025 y cinco turnos recientes disponibles del chat de cierre. Consulta: 06/10/2026. No se leyó el historial completo ni se obtuvo el SHA desplegado, los paneles de producción o Apps Script. El flujo operativo satisfactorio es declaración del propietario. Propuesta, cronograma, preguntas, requisitos, historias General/M1/M2 y prisma-led.zip no se localizaron; la trazabilidad contractual queda pendiente. No se copiaron registros personales ni credenciales. El inventario detalla la disponibilidad de cada fuente.
