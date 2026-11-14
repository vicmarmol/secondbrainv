import { z } from 'zod';
export const answerSchema = z.object({ text: z.string(), document_ids: z.array(z.string()), conflicts: z.array(z.object({ document_id: z.string(), version: z.string() })), difference: z.string() });
export type Answer = z.infer<typeof answerSchema>;
export const MAX_RESULTS = 6;
export const MAX_EXCERPT = 3000;
export function validateAnswer(answer: Answer, ids: string[]) {
 const allowed = new Set(ids);
 if (!answer.text.trim()) throw new Error('El modelo no ha devuelto una respuesta. No se ha guardado ninguna respuesta vacía.');
 if (answer.document_ids.some(id => !allowed.has(id)) || answer.conflicts.some(c => !allowed.has(c.document_id))) throw new Error('El modelo devolvió una fuente no recuperada. No se ha guardado la respuesta.');
 return { ...answer, document_ids: [...new Set([...answer.document_ids, ...answer.conflicts.map(c => c.document_id)])] };
}

export function boundedRetrieval<T extends { excerpt: string }>(documents: T[]): T[] { return documents.slice(0, MAX_RESULTS).map(d => ({ ...d, excerpt: d.excerpt.slice(0, MAX_EXCERPT) })); }
