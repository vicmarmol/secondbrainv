import { describe, expect, it, vi, beforeEach } from 'vitest';
const { state } = vi.hoisted(() => ({ state: { db: {} as any, fail: false, calls: [] as any[], run: {} as any, inventory: {} as any } }));
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({ middleware() { return this; }, inputValidator() { return this; }, handler(fn: any) { return fn; } }) }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
vi.mock('./billing.server', () => ({ requireAppAccess: async () => undefined }));
vi.mock('./notion.server', () => {
 class NotionError extends Error {}
 return { NotionError, NotionReconnectError: class extends NotionError {}, notionConfigured: async () => true, notionRequest: async () => { if (state.fail) throw new NotionError('error'); return { results: [], has_more: false, next_cursor: null }; } };
});
import { stepNotionSync } from './notion.functions';
import { discoverySchema, emptyDiscovery } from './notion';
beforeEach(() => {
 state.calls = []; state.fail = false;
 state.inventory = { ...emptyDiscovery(), seen: ['accessible'] };
 state.run = { id: 'run', connection_id: 'connection', status: 'en_curso', new_documents: 0, updated_documents: 0, inaccessible_documents: 0, progress: { discovery: state.inventory, processed: 0, current: null } };
 state.db = { from(table: string) {
  const b: any = {};
  for (const method of ['select','eq','update']) b[method] = (...args: any[]) => { state.calls.push([table,method,...args]); return b; };
  b.single = async () => ({ data: table === 'sync_runs' ? state.run : { id: 'connection', status: 'conectado' }, error: null });
  b.then = (resolve: any) => resolve({ data: [], error: null }); return b;
 }, rpc: async (name: string, args: any) => { state.calls.push(['rpc',name,args]); return { data: 3, error: null }; } };
});
const step = () => (stepNotionSync as any)({ context: { supabase: state.db, userId: 'owner' }, data: { runId: 'run' } });
describe('Notion access reconciliation', () => {
 it('commits complete successful inventory and returns the inaccessible count', async () => { const result = await step(); expect(result.inaccessibleDocuments).toBe(3); const call = state.calls.find(c => c[0] === 'rpc'); expect(call?.[1]).toBe('finish_notion_sync'); expect(call?.[2].sync_progress.discovery.seen).toEqual(['accessible']); expect(call?.[2].sync_progress.discovery.done).toBe(true); });
 it('does not reconcile if Notion fails', async () => { state.fail = true; const result = await step(); expect(result.error).toBe('error'); expect(state.calls.some(c => c[0] === 'rpc')).toBe(false); });
 it('persists an interrupted scan without reconciling it', async () => { state.inventory.pages = [{ id: 'accessible', url: 'https://notion.so/a', last_edited_time: '2026-11-17', properties: {} }]; const result = await step(); expect(result.done).toBe(false); expect(state.calls.some(c => c[0] === 'rpc')).toBe(false); });
 it('preserves inventory across capped batches instead of treating 50 pages as exhaustive', async () => { state.run.progress.processed = 50; const result = await step(); expect(result.hasMore).toBe(true); const call = state.calls.find(c => c[0] === 'rpc'); expect(call?.[2].sync_progress.discovery.done).toBe(false); expect(call?.[2].sync_progress.discovery.seen).toEqual(['accessible']); });
 it('does not trust legacy cursors as complete inventories', () => { expect(discoverySchema.parse({ seen: ['old'] }).trackingComplete).toBe(false); expect(emptyDiscovery().trackingComplete).toBe(true); });
});