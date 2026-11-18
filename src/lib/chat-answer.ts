import { z } from 'zod';
export const answerSchema = z.object({ text: z.string(), document_ids: z.array(z.string()), conflicts: z.array(z.object({ document_id: z.string(), version: z.string() })), difference: z.string() });
export type Answer = z.infer<typeof answerSchema>;
export const MAX_RESULTS = 8;
export const MAX_EXCERPT = 3000;
export const searchTermsSchema = z.object({ terms: z.array(z.string().trim().min(1).max(120)).min(1).max(24), phrases: z.array(z.string().trim().min(1).max(120)).max(4) });

const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const stopwords = new Set('a al algo algun alguna algunos algunas ante bajo como con contra cual cuales cuando cuanto cuanta cuantos cuantas de del desde donde durante e el ella ellos en entre era es esa ese eso esta estas este estos hay he la las le les lo los mas me mi mis no nos o para pero por que quien se si sin sobre su sus tengo tiene tienen tu tus un una unos unas y ya or'.split(' '));
export function questionWords(question: string) {
 return [...new Set(normalize(question).match(/[\p{L}\p{N}]+/gu) ?? [])].filter(word => !stopwords.has(word) && (word.length > 1 || /^\d+$/.test(word)));
}
/** Only explicitly identified names may be phrases; all other terms are independent OR words. */
export function keywordQuery(terms: string[], phrases: string[] = []) {
 const validated = searchTermsSchema.parse({ terms, phrases });
 const clean = [...new Set(validated.terms.flatMap(questionWords))];
 const names = [...new Set((validated.phrases ?? []).map(name => normalize(name).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()).filter(name => name && !name.split(' ').some(word => word === 'or')))];
 const parts = [...clean, ...names.map(name => `"${name}"`)];
 if (!parts.length) throw new Error('No se han podido extraer temas de la pregunta.');
 return parts.join(' OR ');
}
export function validateAnswer(answer: Answer, ids: string[]) {
 const allowed = new Set(ids);
 if (!answer.text.trim()) throw new Error('El modelo no ha devuelto una respuesta. No se ha guardado ninguna respuesta vacía.');
 if (answer.document_ids.some(id => !allowed.has(id)) || answer.conflicts.some(c => !allowed.has(c.document_id))) throw new Error('El modelo devolvió una fuente no recuperada. No se ha guardado la respuesta.');
 return { ...answer, document_ids: [...new Set([...answer.document_ids, ...answer.conflicts.map(c => c.document_id)])] };
}

export function boundedRetrieval<T extends { excerpt: string }>(documents: T[]): T[] { return documents.slice(0, MAX_RESULTS).map(d => ({ ...d, excerpt: d.excerpt.slice(0, MAX_EXCERPT) })); }
