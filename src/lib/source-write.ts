import { z } from 'zod';
export type SourceId = 'notion' | 'drive' | 'dropbox' | 'granola' | 'garmin' | 'gmail';
export const sourceNames: Record<SourceId, string> = { notion: 'Notion', drive: 'Drive', dropbox: 'Dropbox', granola: 'Granola', garmin: 'Garmin', gmail: 'Gmail' };
export const SAVE_PATTERN = /\b(guarda|guárdame|guardar|apunta|apúntame|anota|anótame|crea una nota|crear una nota|save|note down)\b/i;
export const draftSchema = z.object({ source: z.enum(['notion','drive','dropbox','granola','garmin','gmail']), destinationId: z.string().min(1).max(100), title: z.string().trim().min(1).max(200), content: z.string().trim().min(1).max(20000) });
export function sourceFromName(name: string | null | undefined): SourceId | null {
 const n = (name ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 if (!n) return null;
 if (n.includes('strava')) return 'garmin';
 return (Object.keys(sourceNames) as SourceId[]).find(id => n.includes(id) || (id === 'drive' && n.includes('google drive'))) ?? null;
}
/** Never let the model write: content must be the user's own text; otherwise fall back to the text after ":" or the whole message. */
export function verbatimContent(message: string, proposed: string | null | undefined) {
 const p = (proposed ?? '').trim();
 if (p && message.includes(p)) return p;
 const colon = message.indexOf(':');
 return (colon >= 0 ? message.slice(colon + 1) : message).trim();
}
export function verbatimTitle(message: string, proposed: string | null | undefined, content: string) {
 const p = (proposed ?? '').trim();
 if (p && message.includes(p) && p.length <= 200) return p;
 const first = content.split(/\r?\n/).find(l => l.trim())?.trim() ?? 'Nota';
 return first.length > 80 ? `${first.slice(0, 77)}…` : first;
}
