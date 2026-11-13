# Etapa 1: Biblioteca con datos reales

## Qué cambia para ti
- La app se conecta a Lovable Cloud y guarda el índice de documentos de verdad.
- La Biblioteca se ve igual que ahora con los 20 documentos de ejemplo, pero sin zona de subida ni botones para crear.
- Buscador y filtros por fuente, tipo y fecha; tabla con título, fuente, tipo, fecha de modificación en la fuente y estado.
- Al pulsar una fila se abre un panel con título, fuente, tipo, fechas, resumen, etiquetas, extracto del contenido y "Abrir original" (pestaña nueva). Sin fragmentos.
- Solo se editan las etiquetas y el interruptor "Excluir del índice". Los excluidos se ocultan; el filtro "Mostrar excluidos" permite verlos y reincluirlos. No hay borrado.
- Al terminar, paro y te pido confirmación antes de Conexiones.

## Decisión de permisos (acordada)
Sin inicio de sesión: cualquiera con el enlace puede leer los documentos y cambiar etiquetas/exclusión. No podrá borrar ni crear fichas desde la app. Solo apto para pruebas; antes de usar datos personales reales conviene añadir login.

## Detalles técnicos
- Activar Lovable Cloud. Una migración crea las 5 tablas del brief (documents, conversations, messages, connections, sync_runs) con sus enums, FK en cascada y triggers de updated_at, e inserta todos los datos de ejemplo actuales (external_url plausibles por fuente, content_hash, source_modified_at).
- documents: unique(source, external_id) para que la futura sincronización no reindexe excluidos.
- Permisos de esta etapa: documents con SELECT y UPDATE para anónimos (policy de UPDATE; columnas actualizables restringidas a tags y excluded mediante GRANT por columna). Sin INSERT/DELETE para anónimos. Resto de tablas: solo lectura hasta sus etapas.
- src/services: getDocuments, searchDocuments, updateDocumentTags, setDocumentExcluded leen/escriben vía cliente de Cloud; tipos actualizados (source/type en minúscula mapeados a etiquetas visibles).
- Las citas del chat siguen con fixtures hasta la etapa Chat.
- Actualizar tests de servicios de Biblioteca y la nota de arquitectura en AGENTS.md.
