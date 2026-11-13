import type { Document, Source, DocumentType } from '@/types/second-brain';
const entries: [string, Source, DocumentType, string, string][] = [
 ['Curso de Product Discovery · El MVP', 'Drive', 'PDF', '2026-10-30', 'Un MVP es un producto con las funcionalidades mínimas para validar una hipótesis con usuarios reales. Su objetivo es aprender, no ser una versión reducida del producto final.'],
 ['Mis notas sobre el MVP', 'Notion', 'nota', '2026-10-13', 'Un MVP es la primera versión funcional que se puede vender o usar de verdad. Debe resolver un problema completo, aunque sea para un grupo pequeño de clientes.'],
 ['Reunión de producto · Sprint 24', 'Granola', 'reunión', '2026-11-12', 'Decisiones: priorizar el onboarding; validar el nuevo pricing con cinco clientes; posponer las notificaciones al siguiente sprint. Tareas: Laura preparará el prototipo de onboarding para el 16 de noviembre. Pablo organizará las entrevistas de pricing para el 17 de noviembre.'],
 ['Salidas en bici · Noviembre y octubre', 'Garmin', 'entreno', '2026-11-13', 'Noviembre, semanas 1 y 2: 112 y 138 km. Octubre, semanas 1 y 2: 86 y 104 km. En periodos equivalentes, el volumen ha subido de 190 a 250 km (+31,6 %). Noviembre sigue en curso.'],
 ['Correo de Marta · Propuesta de pricing', 'Gmail', 'nota', '2026-11-10', 'Marta Ruiz, responsable de ventas, propuso el 10 de noviembre probar un plan por equipo en lugar de cobrar por usuario. Mantener la prueba gratuita de 14 días.'],
 ['Pricing · Conversación con Diego', 'Granola', 'reunión', '2026-11-09', 'El 9 de noviembre hablé con Diego Martín, responsable de producto, sobre pricing. Acordamos validar el precio por equipo con cinco clientes antes de cambiar los planes actuales.'],
 ['Roadmap de producto · Q4', 'Notion', 'nota', '2026-11-11', 'Prioridades del trimestre: activación, retención y aprendizaje cualitativo. El onboarding es la apuesta principal.'],
 ['Inspired · Apuntes de lectura', 'Notion', 'nota', '2026-11-08', 'Los equipos de producto deben resolver problemas, no limitarse a entregar funcionalidades. Riesgos: valor, usabilidad, viabilidad y factibilidad.'],
 ['Entrevista con Ana · Onboarding', 'Granola', 'reunión', '2026-11-07', 'Ana se bloqueó al importar sus primeros documentos. Prefiere empezar con un ejemplo antes de conectar su cuenta.'],
 ['Plan de entrenamiento · Base aeróbica', 'Dropbox', 'PDF', '2026-11-06', 'Dos sesiones en zona 2, una sesión de intervalos y una salida larga por semana. El lunes es día de descanso.'],
 ['Salida · Casa de Campo', 'Garmin', 'entreno', '2026-11-05', '42 km, 520 m de desnivel y 1 h 52 min. Sensaciones buenas; mantener ritmo suave al inicio.'],
 ['The Mom Test · Preguntas útiles', 'Notion', 'nota', '2026-11-04', 'Preguntar por comportamientos pasados, no por intenciones futuras. Evitar presentar la solución durante las entrevistas.'],
 ['Métricas de activación · Octubre', 'Drive', 'PDF', '2026-11-03', 'La activación se define como guardar tres documentos y realizar una primera consulta durante los primeros siete días.'],
 ['Retro del equipo · Sprint 23', 'Granola', 'reunión', '2026-11-02', 'Reducir el trabajo en paralelo y reservar una hora semanal para revisar lo aprendido en las entrevistas.'],
 ['Ruta larga · Sierra de Madrid', 'Garmin', 'entreno', '2026-11-01', '70 km y 980 m de desnivel. Tomar 60 gramos de carbohidratos por hora en salidas de más de dos horas.'],
 ['Curso de investigación · Síntesis', 'Drive', 'PDF', '2026-10-29', 'Agrupar observaciones por patrones y separar los hechos de las interpretaciones del equipo.'],
 ['Ideas para mejorar la búsqueda', 'Notion', 'nota', '2026-10-27', 'Mostrar siempre el origen de cada respuesta y destacar los documentos que se contradicen.'],
 ['Objetivos de ciclismo · Invierno', 'Dropbox', 'nota', '2026-10-25', 'Mantener la constancia con tres salidas semanales y mejorar la resistencia en subidas largas.'],
 ['Revisión de diseño · Biblioteca', 'Granola', 'reunión', '2026-10-23', 'Los filtros deben permitir combinar origen, tipo y fecha. El estado de indexación debe ser visible.'],
 ['Continuous Discovery Habits · Notas', 'Notion', 'nota', '2026-10-20', 'Mantener contacto semanal con clientes. Conectar oportunidades con resultados de producto concretos.'],
];
export const documents: Document[] = entries.map(([title, source, type, date, summary], i) => ({ id: `doc-${i + 1}`, title, source, type, date, summary, status: 'Indexado', tags: type === 'entreno' ? ['Ciclismo', 'Entrenamiento'] : ['Producto', 'Aprendizaje'], chunks: [{ id: `chunk-${i + 1}`, text: summary }] }));
