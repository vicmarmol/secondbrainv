import { documents } from '@/data/documents';
import { rides } from '@/data/rides';
import type { Message } from '@/types/second-brain';
const delay = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));
export { getDocuments, searchDocuments, updateDocumentTags, setDocumentExcluded, normalizeTags } from './library';
export { getConnections, setConnected, syncNow } from './connections';
export { loadSampleData, signOut, getCurrentEmail } from './settings';
export { getConversations, createConversation, saveMessage, renameConversation, deleteConversation, groupFor } from './chat';
export async function getRides() { await delay(); return structuredClone(rides); }
export async function sendMessage(question: string): Promise<Message> {
 await delay(700);
 const q = question.toLocaleLowerCase('es');
 let content = 'No he encontrado información relevante en tus fuentes de ejemplo. Prueba a reformular la pregunta o a concretar un tema, una persona o una fecha.';
 let ids: string[] = [];
 let kind: Message['kind'];
 if (q.includes('mvp')) { ids = ['doc-1', 'doc-2']; kind = 'conflict'; content = 'Tus fuentes tienen dos interpretaciones de un MVP.\n\nLas transparencias del curso lo definen como un producto con las funcionalidades mínimas para validar una hipótesis con usuarios reales. Tus notas personales lo describen como una primera versión funcional que se puede vender o usar de verdad.\n\nLa diferencia está en el objetivo: aprender y validar frente a entregar un producto utilizable. No hay una definición única entre estas dos fuentes.'; }
 else if (q.includes('reunión') || q.includes('reunion')) { ids = ['doc-3']; content = 'En la última reunión de producto, el 12 de noviembre, tomamos estas decisiones:\n\n1. Priorizar el onboarding en el próximo sprint.\n2. Validar el nuevo pricing con cinco clientes.\n3. Posponer las notificaciones al siguiente sprint.\n\nQuedaron dos tareas pendientes:\n• Laura: preparar el prototipo de onboarding para el 16 de noviembre.\n• Pablo: organizar las entrevistas de pricing para el 17 de noviembre.'; }
 else if (q.includes('bici') || q.includes('salidas')) { ids = ['doc-4']; kind = 'rides'; content = 'Has recorrido 250 km en las dos primeras semanas de noviembre, frente a 190 km en las mismas semanas de octubre.\n\nTu volumen ha aumentado un 31,6 %. Estás siendo más constante y sumando kilómetros en ambas semanas. Comparamos solo semanas equivalentes: noviembre todavía está en curso.'; }
 else if (q.includes('pricing')) { ids = ['doc-5', 'doc-6']; content = 'Hablaste sobre pricing con dos personas:\n\n• Marta Ruiz, responsable de ventas, por correo el 10 de noviembre. Propuso probar un plan por equipo y mantener los 14 días de prueba gratuita.\n\n• Diego Martín, responsable de producto, en una reunión el 9 de noviembre. Acordasteis validar el precio por equipo con cinco clientes antes de cambiar los planes.'; }
 return { id: `answer-${crypto.randomUUID()}`, role: 'assistant', content, kind, citations: structuredClone(documents.filter(d => ids.includes(d.id)).map(document => ({ document, chunkId: document.chunks[0]?.id ?? '' }))) };
}
