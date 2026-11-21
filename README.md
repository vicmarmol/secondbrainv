# Second Brain

Construye el prototipo de front-end de una aplicación web llamada "Second Brain": un asistente personal con chat que busca en todas las fuentes de información del usuario (notas, documentos, reuniones, datos de entrenamiento) y responde citando de dónde sale cada dato.

IMPORTANTE: es solo un prototipo visual. No añadas backend, base de datos, autenticación ni llamadas a APIs externas. Todo funciona con datos de ejemplo guardados en el código y estado local. Toda la interfaz está en español.

ARQUITECTURA (para poder conectar datos reales más adelante)
- Todos los datos de ejemplo viven en una carpeta /src/data (documents.ts, conversations.ts, connections.ts, rides.ts).
- Crea una capa /src/services con funciones asíncronas (searchDocuments, sendMessage, getConversations, getDocuments, getConnections) que ahora devuelven los datos de ejemplo con un pequeño retardo simulado. Los componentes solo llaman a estas funciones, nunca importan los datos directamente.
- Define tipos TypeScript claros: Document, Chunk, Citation, Message, Conversation, Connection.

DISEÑO
- Estilo limpio y minimalista, tipo herramienta de productividad. Tipografía sans-serif, mucho espacio en blanco, esquinas redondeadas suaves, un único color de acento (azul o violeta suave).
- Modo claro y oscuro con selector.
- Responsive: en móvil, la barra lateral se convierte en un menú desplegable.
- Barra lateral izquierda con: logo y nombre, botón "Nueva conversación", lista de conversaciones recientes agrupadas por "Hoy", "Ayer" y "Anteriores", y navegación a "Chat", "Biblioteca" y "Conexiones".

PANTALLA 1: CHAT (pantalla principal)
- Área central con los mensajes y una caja de texto fija abajo con botón de enviar. Si no hay mensajes, muestra un estado inicial con título "¿Qué necesitas recordar?" y 4 sugerencias clicables: "¿Qué es un MVP?", "¿Qué acordamos en la última reunión de producto?", "¿Con quién hablé sobre pricing?", "Compara mis salidas en bici de este mes con el anterior".
- Las respuestas del asistente aparecen con efecto de escritura progresiva y debajo muestran las fuentes como chips clicables: icono de tipo (nota, PDF, reunión, entreno), título, fuente de origen (Notion, Drive, Dropbox, Granola, Garmin) y fecha.
- Al pulsar un chip se abre un panel lateral derecho con la vista previa del documento: título, fuente, fecha, tipo y el fragmento relevante resaltado, con un botón "Abrir original" (sin acción real).
- Si dos fuentes se contradicen, muestra una tarjeta especial "Fuentes en desacuerdo" con las dos versiones lado a lado, cada una con su fuente y fecha, y una nota breve de la diferencia. Esto es clave en el producto.
- Cada respuesta tiene botones de "copiar", "útil" y "no útil".

RESPUESTAS SIMULADAS (según palabras clave de la pregunta; si no coincide ninguna, una respuesta genérica diciendo que no ha encontrado nada y sugiriendo reformular)
1. "MVP": dos fuentes que se contradicen. Transparencias del curso (Drive, hace 2 semanas): "producto con las funcionalidades mínimas para validar una hipótesis con usuarios reales". Notas personales (Notion, hace 1 mes): "primera versión funcional que se puede vender o usar de verdad". Muestra la tarjeta de desacuerdo.
2. "reunión": respuesta con resumen de 3 decisiones y 2 tareas pendientes, citando una reunión de Granola de ayer.
3. "bici" o "salidas": respuesta breve con un gráfico de barras (usa Recharts) comparando kilómetros por semana de este mes y del anterior, con una tabla de datos debajo y una frase de interpretación. Cita Garmin como fuente.
4. "pricing": cita un correo y una reunión, indicando con quién y cuándo.

PANTALLA 2: BIBLIOTECA
- Cabecera con buscador y filtros por fuente (Notion, Drive, Dropbox, Granola, Garmin, Subidos manualmente), tipo (nota, PDF, reunión, entreno) y rango de fechas.
- Tabla con los documentos: título, fuente, tipo, fecha de modificación, estado (Indexado, Procesando, Error) con un indicador de color.
- Zona de subida de archivos arrastrando y soltando. Al soltar un archivo, simula el proceso con una barra de progreso y un nuevo documento "Indexado" en la tabla.
- Al pulsar una fila, abre un panel con el resumen generado automáticamente, etiquetas y los fragmentos en que se ha dividido.
- Crea 20 documentos de ejemplo realistas: notas de producto, apuntes de libros y cursos, actas de reuniones, planes de entrenamiento.

PANTALLA 3: CONEXIONES
- Tarjetas para Notion, Google Drive, Dropbox, Granola, Garmin/Strava, Gmail y WhatsApp.
- Cada tarjeta muestra el logo, el estado (Conectado, Desconectado, Próximamente), la fecha de la última sincronización, el número de documentos y un botón "Sincronizar ahora" o "Conectar".
- Gmail y WhatsApp aparecen como "Próximamente".
- Al pulsar "Sincronizar ahora", simula una sincronización con un indicador de progreso.

DETALLES
- Estados vacíos y de carga cuidados en todas las pantallas.
- Animaciones suaves y discretas.
- No incluyas pantallas de login ni de registro.
- Todo el contenido de ejemplo debe parecer real y coherente (nombres de documentos, fechas recientes, contexto de un product manager que también hace ciclismo).

Empieza por la estructura general, la barra lateral y la pantalla de Chat con las respuestas simuladas. Después construiremos la Biblioteca y las Conexiones.

Importante: Si crees que estoy olvidando algún punto importante de un second brain sugieremelo antes de desarrollarlo

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://secondbrainv.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5c8ea5c9-9c6d-436e-b7fa-66de8e4118d4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
