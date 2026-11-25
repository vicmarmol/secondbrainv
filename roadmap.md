# Second Brain

## Páginas legales públicas
- [x] Crear /privacidad y /condiciones con información del titular y servicios usados.
- [x] Enlazar desde el login; acceso sin sesión y navegación verificados en escritorio/móvil, 133 pruebas pasan.
- [ ] Publicar y verificar secondbrainv.lovable.app: autorizado incluir los cambios anteriores pendientes.

## Cuenta de prueba de bienvenida
- [x] Cuenta demo permanente, aprobada y sin fuentes ni documentos, con credenciales para el titular; verificar que abre /bienvenida.

## Bienvenida sin fuentes
- [x] Añadir /bienvenida sin barra lateral, Notion y fuentes futuras; acciones y estados de carga/error.
- [x] Redirigir entrada al chat con cero conexiones activas y cero documentos, incluyendo ejemplos; conservar autorización y Ver como.
- [x] Verificar con cuenta temporal aprobada: 20 ejemplos is_sample sin alterar conexiones, redirección con una conexión o documentos, cancelación real de Notion, cierre de sesión, móvil/claro/oscuro y preview vacío simulado. Consentimiento completo de Notion requiere la cuenta del titular; no se modificaron fuentes reales.

## Registro con invitación
- [x] Pantalla /registro y enlaces de la landing; conservar login.
- [x] Código temporal de una hora y canje único autenticado antes de comprobar aprobación; aviso sin editar la espera.
- [x] Caducidad, redirecciones y canjes reales inválido/limitado/válido verificados con cuenta temporal; prueba de siete días leída y sin paso por espera. Confirmación de correo y llamada Google verificadas con respuestas simuladas, no consentimiento externo.

## Invitaciones
- [x] Crear código único activo e historial privados para admin.
- [x] Añadir gestión de invitaciones junto a solicitudes en Ajustes sin cambiar Ver como.
- [x] Canje atómico con aprobación y prueba compartidas; límite propio confirmado: cinco fallos por usuario por hora.
- [x] Verificar permisos y reglas con cuenta temporal; gestión, copia e historial en Ajustes, canjes concurrentes y prueba exacta de siete días. Pantalla pendiente intacta.

## Página pública
- [x] Simplificar landing a hero, franja de fuentes, beneficios, pasos y cierre compacto; cabecera, chat y pie intactos; verificado en 926/1440/390/360 px, claro/oscuro, sin cortes y acceso correcto (1618 px de alto en el escritorio actual).
- [x] Crear landing con maqueta HTML de chat, beneficios, pasos, fuentes y privacidad.
- [x] Mostrarla sin sesión en /, conservar entrada a la app con sesión y trasladar login a /login.
- [x] Comprobar navegación, sesión real, escritorio y móvil sin cambiar datos ni funciones de la app.
- [x] Rediseñar «Cómo funciona» como tres tarjetas en fila (apiladas en móvil) con número, icono, título y descripción, flechas sutiles en escritorio, menos hueco vertical y sin la etiqueta «Así de sencillo»; verificado en claro/oscuro.

## Aprobación de cuentas
- [x] Estado pendiente/aprobado/rechazado y prueba desde aprobación, protección de datos y sincronización.
- [x] Pantalla de espera/rechazo y solicitudes en Ajustes con contador para admin; conservar Ver como.
- [x] Verificar aprobación y rechazo mediante Ajustes con dos cuentas temporales, bloqueo RLS y prueba exacta de siete días; cuentas retiradas. Sin dominio de correo configurado, solo indicador en la app.

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
- [x] Diagnosticar términos actuales, ampliar OR con palabras (títulos ya ponderados), añadir segundo intento y verificar las cinco preguntas: formato y fecha detectan contradicciones, coste 5 €/mes, Product Builder encontrado, coche 2030 sin respuesta; 28 pruebas y lectura tras recarga correctas.
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

## Sincronización automática
- [x] Interfaz común de conector, Notion adaptado, tarea horaria genérica, sin solapes, errores con "Requiere atención" y "hace X (automática/manual)"; ejecución real verificada.

## Crear notas desde el chat
- [x] Capacidad opcional «crear» en conectores (solo Notion), borrador Guardar/Editar/Descartar, guardado en Biblioteca con mismo id y huella, y deshacer si falla.
- [ ] Probar un guardado real en Notion: requiere activar «Insertar contenido» en la integración.
