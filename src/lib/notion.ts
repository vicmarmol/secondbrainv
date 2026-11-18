import { z } from 'zod';

export const MAX_NOTION_PAGES = 50;
export const SUMMARY_LENGTH = 300;
const pageSchema = z.object({ id: z.string(), url: z.string(), last_edited_time: z.string(), properties: z.record(z.unknown()) });
export type NotionPage = z.infer<typeof pageSchema>;
export const discoverySchema = z.object({
 cursor: z.string().nullable().default(null), done: z.boolean().default(false),
 sources: z.array(z.object({ id: z.string(), cursor: z.string().nullable() })).default([]),
 pages: z.array(pageSchema).default([]), seen: z.array(z.string()).default([]),
 trackingComplete: z.boolean().default(false),
});
export const progressSchema = z.object({
 discovery: discoverySchema, processed: z.number().default(0),
 current: z.object({ page: pageSchema, queue: z.array(z.object({ id: z.string(), cursor: z.string().nullable() })), text: z.array(z.string()) }).nullable().default(null),
});
export const emptyDiscovery = () => discoverySchema.parse({ trackingComplete: true });
export function discoveryExhausted(d: z.infer<typeof discoverySchema>) {
 return d.done && d.pages.length === 0 && d.sources.length === 0;
}
export function pageTitle(page: NotionPage) {
 const title = Object.values(page.properties).find((p): p is { type: string; title: { plain_text: string }[] } => !!p && typeof p === 'object' && 'type' in p && p.type === 'title');
 return title?.title?.map(t => t.plain_text).join('') || 'Sin título';
}
const textTypes = new Set(['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote', 'code']);
export function blockText(block: { type: string; [key: string]: unknown }) {
 if (!textTypes.has(block.type)) return null;
 const body = block[block.type] as { rich_text?: { plain_text?: string; text?: { content: string } }[] } | undefined;
 return body?.rich_text?.map(t => t.plain_text ?? t.text?.content ?? '').join('') ?? '';
}
export async function contentHash(content: string) {
 const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
 return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export function documentChange(existing: { content_hash: string | null; excluded: boolean } | null, hash: string) {
 return existing?.excluded || existing?.content_hash === hash ? 'skip' : existing ? 'update' : 'insert';
}
/** One paragraph per non-empty line; joined like sync joins block text, so hashes match. */
export const MAX_NOTE_LINES = 100;
const noteLines = (text: string) => text.split(/\r?\n/).map(l => l.trimEnd()).filter(l => l.trim());
export function notionContent(text: string) { return noteLines(text).join('\n\n'); }
export function notionParagraphs(text: string) {
 return noteLines(text).map(line => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: (line.match(/[\s\S]{1,2000}/g) ?? []).map(content => ({ type: 'text', text: { content } })) } }));
}
