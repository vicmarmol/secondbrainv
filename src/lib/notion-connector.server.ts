import { notionConfigured, notionRequest, NotionError, NotionReconnectError } from './notion.server';
import { blockText, contentHash, discoverySchema, discoveryExhausted, documentChange, emptyDiscovery, MAX_NOTION_PAGES, pageTitle, progressSchema, SUMMARY_LENGTH } from './notion';
import type { Json } from '@/integrations/supabase/types';
import type { SourceConnector } from './sync/types';

function checked<T>(result: { data: T; error: unknown }): T {
 if (result.error) throw new Error('No se ha podido guardar la sincronización.');
 return result.data;
}

export const notionConnector: SourceConnector = {
 source: 'notion',
 isReady: notionConfigured,
 initialProgress(connection) {
  const saved = connection.notion_cursor ? discoverySchema.parse(connection.notion_cursor) : null;
  const discovery = saved && !discoveryExhausted(saved) ? saved : emptyDiscovery();
  return { discovery, processed: 0, current: null };
 },
 describeError(error) {
  return { message: error instanceof NotionError ? error.message : 'La sincronización no ha podido completarse. Vuelve a intentarlo; tus documentos se conservan.', disconnect: error instanceof NotionReconnectError };
 },
 async step({ db, userId, run }) {
  let newDocuments = run.new_documents, updatedDocuments = run.updated_documents;
  const progress = progressSchema.parse(run.progress);
  const d = progress.discovery;
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
     const changed = checked(await db.from('documents').update(values).eq('id', old.id).eq('user_id', userId).eq('excluded', false).eq('is_sample', false).select('id'));
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
  // Access reconciliation and successful completion commit together; errors cannot leave partial marks.
  const inaccessibleDocuments = done
   ? checked(await db.rpc('finish_notion_sync', { sync_id: run.id, sync_progress: progress as unknown as Json, new_count: newDocuments, updated_count: updatedDocuments, owner: userId })) ?? 0
   : run.inaccessible_documents ?? 0;
  if (!done) checked(await db.from('sync_runs').update({ progress: progress as unknown as Json, new_documents: newDocuments, updated_documents: updatedDocuments }).eq('id', run.id).eq('user_id', userId));
  return { done, processed: progress.processed, newDocuments, updatedDocuments, inaccessibleDocuments, hasMore: done && hasMore };
 },
};
