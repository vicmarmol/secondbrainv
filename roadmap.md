# Second Brain

- [x] Estructura de datos tipados y servicios simulados.
- [x] Navegación adaptable y selector claro/oscuro.
- [x] Chat con respuestas progresivas, citas, desacuerdos y comparación ciclista.
- [x] Verificar preguntas, conversaciones y vista previa en escritorio y móvil.

## Datos reales
- [x] Biblioteca conectada al índice (etiquetas, excluir/reincluir, abrir original).
- [x] Conexiones: conectar, desconectar y sincronizar (last_synced_at).
- [x] Chat: conversaciones y mensajes guardados, renombrar y borrar.

## Cuentas
- [x] Inicio de sesión, registro con confirmación y Google; páginas protegidas y cerrar sesión.
- [x] Datos por usuario con seguridad por filas; datos de ejemplo bajo demanda en Ajustes.

## Notion
- [x] Marcar documentos sin acceso solo al completar un recorrido sin errores; filtro en Biblioteca, exclusión del chat y resumen, sin borrar documentos. Verificado con 42 documentos conservados, 30 sin acceso, ambas búsquedas sin filtraciones y 40 pruebas.
- [x] Sustituir acceso global por conexión Notion individual y credenciales cifradas.
- [x] Limpiar importaciones y sincronizaciones de Notion de Laura.
- [x] Verificar claves aisladas, permisos y apertura de autorización; explicar pruebas con dos usuarios.
- [ ] Completar consentimiento real y sincronización con dos cuentas de Notion: requiere autorización de sus titulares.
- [x] Usar el conector oficial de Notion (sustituye la petición de API directa).
- [x] Sincronización real paginada, huellas, exclusiones e historial por usuario.
- [x] Verificar reglas y sincronización desde la cuenta con sesión.

## Chat con documentos reales
- [x] Entender seguimientos con los últimos cuatro mensajes; «¿y qué más dice ese documento?» recupera Product Builder, conserva la pregunta original y la respuesta tras recarga; 22 pruebas pasan.
- [x] Documentos cortos completos y pasajes relevantes de documentos largos, límites de 6000/documento y 15000 totales; Product Builder envía sus 2460 caracteres con funcionalidades y roadmap, y el contexto persiste tras recargar.
- [x] Consultas recientes por fecha, tema opcional y periodos de Madrid; fechas en cada cita, cinco preguntas verificadas con documentos reales y respuesta persistida en móvil/escritorio claro/oscuro.
- [x] Búsqueda española ponderada y fragmentos de 3000 caracteres.
- [x] Extraer 3–6 temas con sinónimos, buscar con OR y ts_rank_cd, hasta ocho resultados; pregunta sobre Second Brain recupera Product Builder y persiste tras recarga.
- [x] Respuestas de Lovable AI, citas, contradicciones y guardado por usuario.
- [x] Verificar preguntas reales, errores y documentos enviados al modelo.

## Pagos
- [x] Roles protegidos admin/user, prueba desde registro y acceso gratuito para admin; pruebas vencidas verificadas en ambas cuentas y cambios de roles rechazados desde la app.
- [x] Habilitar Stripe con confirmación del propietario.
- [x] Configurar precio y suscripción; prueba gratuita de 7 días y bloqueo al terminar sin pago.
- [x] Verificar reglas de acceso, aislamiento del modo de prueba y formulario en escritorio/móvil.
- [ ] Completar compra de prueba y comprobar confirmación: envío automatizado no finalizado; requiere prueba manual.

- [x] Explicar cómo probar un pago sin dinero real.
