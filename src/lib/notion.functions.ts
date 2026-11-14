import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { notionConfigured, notionRequest, NotionError, NotionReconnectError } from './notion.server';
import { blockText, contentHash, discoverySchema, documentChange, emptyDiscovery, MAX_NOTION_PAGES, pageTitle, progressSchema, SUMMARY_LENGTH } from './notion';
import type { Database, Json } from '@/integrations/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<Database>;
function checked<T>(result: { data: T; error: unknown }): T {
 if (result.error) throw new Error('No se ha podido guardar la sincronización.');
 return result.data;
}
async function ownedConnection(db: Client, userId: string) {
 const row = checked(await db.from('connections').select('*').eq('user_id', userId).eq('source', 'notion').single());
 if (!row) throw new Error('No se ha encontrado tu conexión de Notion.');
 return row;
}
export const getNotionState = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const connection = await ownedConnection(context.supabase, context.userId);
 const runs = checked(await context.supabase.from('sync_runs').select('*').eq('user_id', context.userId).eq('connection_id', connection.id).order('started_at', { ascending: false }).limit(5));
 return { configured: connection.status === 'conectado' && await notionConfigured(context.userId), runs: runs ?? [], hasMore: connection.notion_cursor !== null };
});
export const beginNotionSync = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const { supabase: db, userId } = context;
 const { requireAppAccess } = await import('./billing.server'); await requireAppAccess(db);
 const connection = await ownedConnection(db, userId);
 if (connection.status !== 'conectado' || !await notionConfigured(userId)) throw new NotionError('Conecta tu propia cuenta de Notion antes de sincronizar.');
 const existing = checked(await db.from('sync_runs').select('*').eq('connection_id', connection.id).eq('user_id', userId).eq('status', 'en_curso').maybeSingle());
 if (existing) return existing.id;
 const discovery = connection.notion_cursor ? discoverySchema.parse(connection.notion_cursor) : emptyDiscovery();
 const run = checked(await db.from('sync_runs').insert({ user_id: userId, connection_id: connection.id, status: 'en_curso', progress: { discovery, processed: 0, current: null } as unknown as Json }).select('id').single());
 if (!run) throw new Error('No se ha podido iniciar la sincronización.');
 return run.id;
});
export const stepNotionSync = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ runId: z.string().uuid() })).handler(async ({ context, data }) => {
 const { supabase: db, userId } = context;
 const { requireAppAccess } = await import('./billing.server'); await requireAppAccess(db);
 const run = checked(await db.from('sync_runs').select('*').eq('id', data.runId).eq('user_id', userId).single());
 if (!run) throw new Error('Sincronización no disponible.');
 if (run.status !== 'en_curso') return { done: true, processed: 0, newDocuments: run.new_documents, updatedDocuments: run.updated_documents, hasMore: false, error: run.error_message };
 let newDocuments = run.new_documents, updatedDocuments = run.updated_documents;
 const progress = progressSchema.parse(run.progress);
 const d = progress.discovery;
 try {
   const connection = await ownedConnection(db, userId);
   if (connection.status !== 'conectado' || !await notionConfigured(userId)) throw new NotionError('Conecta tu propia cuenta de Notion antes de sincronizar.');
  if (!progress.current && progress.processed < MAX_NOTION_PAGES) {
   if (!d.pages.length && d.sources.length) {
    const source = d.sources[0];
    if (source) {
     const response = await notionRequest(userId, `/data_sources/${source.id}/query`, { page_size: 50, ...(source.cursor ? { start_cursor: source.cursor } : {}) });
     d.pages.push(...response.results.filter((p: any) => !p.archived && !p.in_trash));
     if (response.has_more) source.cursor = response.next_cursor; else d.sources.shift();
    }
   } else if (!d.pages.length && !d.done) {
     const response = await notionRequest(userId, '/search', { page_size: 50, ...(d.cursor ? { start_cursor: d.cursor } : {}), sort: { direction: 'ascending', timestamp: 'last_edited_time' } });
    for (const result of response.results) {
     if (result.object === 'page' && !result.archived && !result.in_trash) d.pages.push(result);
     if (result.object === 'data_source') d.sources.push({ id: result.id, cursor: null });
    }
    d.cursor = response.next_cursor; d.done = !response.has_more;
   }
   while (d.pages.length && !progress.current) {
    const page = d.pages.shift();
    if (!page || d.seen.includes(page.id)) continue;
    d.seen.push(page.id);
    const old = checked(await db.from('documents').select('excluded').eq('user_id', userId).eq('source', 'notion').eq('external_id', page.id).maybeSingle());
    if (old?.excluded) { progress.processed++; if (progress.processed >= MAX_NOTION_PAGES) break; continue; }
    progress.current = { page, queue: [{ id: page.id, cursor: null }], text: [] };
   }
  }
  const current = progress.current;
  if (current) {
   // Small persisted steps avoid one long Worker request for large pages.
   for (let i = 0; i < 4 && current.queue.length; i++) {
    const task = current.queue.shift();
    if (!task) break;
     const response = await notionRequest(userId, `/blocks/${task.id}/children?page_size=100${task.cursor ? `&start_cursor=${encodeURIComponent(task.cursor)}` : ''}`);
    const nextTasks: { id: string; cursor: string | null }[] = [];
    for (const block of response.results) {
     const text = blockText(block);
     if (text !== null) current.text.push(text);
     if (block.has_children && block.type !== 'child_page' && block.type !== 'child_database') nextTasks.push({ id: block.id, cursor: null });
    }
    if (response.has_more) nextTasks.push({ id: task.id, cursor: response.next_cursor });
    current.queue.unshift(...nextTasks);
   }
   if (!current.queue.length) {
    const content = current.text.join('\n\n');
    const hash = await contentHash(content);
    const old = checked(await db.from('documents').select('id,content_hash,excluded').eq('user_id', userId).eq('source', 'notion').eq('external_id', current.page.id).maybeSingle());
    const change = documentChange(old, hash);
    const values = { title: pageTitle(current.page), content, summary: content.slice(0, SUMMARY_LENGTH), content_hash: hash, source_modified_at: current.page.last_edited_time, external_url: current.page.url };
    if (change === 'update' && old) {
     const changed = checked(await db.from('documents').update(values).eq('id', old.id).eq('user_id', userId).eq('excluded', false).select('id'));
     updatedDocuments += changed?.length ?? 0;
    }
    if (change === 'insert') {
     const inserted = checked(await db.from('documents').upsert({ ...values, user_id: userId, source: 'notion', type: 'nota', status: 'indexado', external_id: current.page.id }, { onConflict: 'user_id,source,external_id', ignoreDuplicates: true }).select('id'));
     newDocuments += inserted?.length ?? 0;
    }
    progress.processed++; progress.current = null;
   }
  }
  const hasMore = !!progress.current || !!d.pages.length || !!d.sources.length || !d.done;
  const done = progress.processed >= MAX_NOTION_PAGES || !hasMore;
  if (done) {
   const count = await db.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('source', 'notion').eq('excluded', false).not('content_hash', 'is', null);
   checked(count);
   checked(await db.from('connections').update({ status: 'conectado', last_synced_at: new Date().toISOString(), document_count: count.count ?? 0, notion_cursor: hasMore ? d as unknown as Json : null }).eq('id', run.connection_id).eq('user_id', userId));
  }
  checked(await db.from('sync_runs').update({ progress: progress as unknown as Json, new_documents: newDocuments, updated_documents: updatedDocuments, ...(done ? { status: 'completada' as const, finished_at: new Date().toISOString() } : {}) }).eq('id', run.id).eq('user_id', userId));
  return { done, processed: progress.processed, newDocuments, updatedDocuments, hasMore: done && hasMore, error: null };
 } catch (error) {
   if (error instanceof NotionReconnectError) checked(await db.from('connections').update({ status: 'desconectado' }).eq('id', run.connection_id).eq('user_id', userId));
  const message = error instanceof NotionError ? error.message : 'La sincronización no ha podido completarse. Vuelve a intentarlo; tus documentos se conservan.';
  checked(await db.from('sync_runs').update({ status: 'error', finished_at: new Date().toISOString(), error_message: message, new_documents: newDocuments, updated_documents: updatedDocuments }).eq('id', run.id).eq('user_id', userId));
  return { done: true, processed: progress.processed, newDocuments, updatedDocuments, hasMore: false, error: message };
 }
});