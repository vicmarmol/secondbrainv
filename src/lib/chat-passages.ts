export const DOCUMENT_CONTEXT_LIMIT = 6000;
export const TOTAL_CONTEXT_LIMIT = 15000;
const PASSAGE_SIZE = 800;
const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const stopwords = new Set('que y lo la el los las de del un una unos unas sobre ultimo ultima ultimos ultimas reciente recientes actualizado actualizados editado editados documentos documento tengo algun alguna he hoy esta este semana mes revisa marcha'.split(' '));

export function splitPassages(content: string) {
 const passages: { text: string; index: number }[] = [];
 for (const block of content.split(/\n\s*\n|(?=^#{1,6}\s)/m).filter(s => s.trim())) {
  let rest = block.trim();
  while (rest.length > PASSAGE_SIZE) {
   const boundary = rest.lastIndexOf(' ', PASSAGE_SIZE);
   const end = boundary > PASSAGE_SIZE / 2 ? boundary : PASSAGE_SIZE;
   passages.push({ text: rest.slice(0, end), index: passages.length });
   rest = rest.slice(end).trimStart();
  }
  if (rest) passages.push({ text: rest, index: passages.length });
 }
 return passages;
}

export function selectPassages(content: string, question: string, searchQuery: string, budget = DOCUMENT_CONTEXT_LIMIT) {
 if (content.length <= budget) return content;
 const terms = [...new Set(normalize(`${question} ${searchQuery}`).match(/[\p{L}\p{N}]+/gu) ?? [])].filter(t => t.length > 2 && !stopwords.has(t) && t !== 'or');
 const phrases = [...searchQuery.matchAll(/"([^"]+)"/g)].map(m => normalize(m[1] ?? ''));
 const passages = splitPassages(content);
 const scored = passages.map(p => {
  const text = normalize(p.text);
  const words = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  const score = terms.reduce((sum, term) => sum + Math.min(words.filter(w => w === term || (term.length > 4 && w.startsWith(term))).length, 3), 0)
   + phrases.reduce((sum, phrase) => sum + (phrase && text.includes(phrase) ? 5 : 0), 0);
  return { ...p, score };
 }).sort((a, b) => b.score - a.score || a.index - b.index);
 const chosen: typeof scored = [];
 let used = 0;
 for (const p of scored) {
  const separator = chosen.length ? '\n\n--- PASAJE ---\n\n' : '';
  if (used + separator.length + p.text.length <= budget) { chosen.push(p); used += separator.length + p.text.length; }
 }
 return chosen.sort((a,b) => a.index-b.index).map(p => p.text).join('\n\n--- PASAJE ---\n\n');
}

export function buildDocumentContext<T extends { document_id: string; excerpt: string }>(documents: T[], contentById: Map<string, string>, question: string, searchQuery: string): T[] {
 let remaining = TOTAL_CONTEXT_LIMIT;
 const result: T[] = [];
 for (const doc of documents) {
  const content = contentById.get(doc.document_id) ?? doc.excerpt;
  const excerpt = selectPassages(content, question, searchQuery, Math.min(DOCUMENT_CONTEXT_LIMIT, remaining));
  if (!excerpt) continue;
  result.push({ ...doc, excerpt }); remaining -= excerpt.length;
 }
 return result;
}