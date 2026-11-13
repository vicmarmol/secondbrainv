import { describe, it, expect, vi, beforeEach } from 'vitest';
const calls: { method: string; args: unknown[] }[] = [];
const row = (over: Record<string, unknown> = {}) => ({ id: 'doc-1', title: 'T', source: 'drive', type: 'pdf', status: 'indexado', summary: 's', tags: ['A'], content: 'c', external_id: 'x', external_url: 'https://drive.google.com/file/d/x/view', content_hash: null, source_modified_at: '2026-10-30T09:00:00Z', excluded: false, created_at: '2026-10-30T10:00:00Z', updated_at: '2026-10-30T10:00:00Z', ...over });
function builder() {
 const b: Record<string, unknown> = {};
 for (const m of ['select', 'order', 'eq', 'update']) b[m] = (...args: unknown[]) => { calls.push({ method: m, args }); return b; };
 b['single'] = () => Promise.resolve({ data: row({ tags: ['Producto', 'Ciclismo'], excluded: true }), error: null });
 b['then'] = (resolve: (v: unknown) => void) => resolve({ data: [row()], error: null });
 return b;
}
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => builder() } }));
import { getDocuments, updateDocumentTags, setDocumentExcluded } from './library';
beforeEach(() => { calls.length = 0; });
describe('Biblioteca', () => {
 it('hides excluded documents by default', async () => { await getDocuments(); expect(calls).toContainEqual({ method: 'eq', args: ['excluded', false] }); });
 it('can include excluded documents on request', async () => { await getDocuments({ includeExcluded: true }); expect(calls.some(c => c.method === 'eq' && c.args[0] === 'excluded')).toBe(false); });
 it('tag edits only write tags, trimmed and deduplicated', async () => { await updateDocumentTags('doc-1', [' Producto ', 'Producto', '', 'Ciclismo']); expect(calls.find(c => c.method === 'update')?.args[0]).toEqual({ tags: ['Producto', 'Ciclismo'] }); });
 it('excluding only writes the excluded flag', async () => { const doc = await setDocumentExcluded('doc-1', true); expect(calls.find(c => c.method === 'update')?.args[0]).toEqual({ excluded: true }); expect(doc.excluded).toBe(true); });
 it('maps index rows to visible labels and the original link', async () => { const [doc] = await getDocuments(); expect(doc?.source).toBe('Drive'); expect(doc?.type).toBe('PDF'); expect(doc?.date).toBe('2026-10-30'); expect(doc?.externalUrl).toContain('drive.google.com'); });
});
