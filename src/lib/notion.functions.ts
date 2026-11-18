import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { notionConfigured } from './notion.server';
import { startSync, stepSync } from './sync/engine.server';
import type { Database } from '@/integrations/supabase/types';
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
// "Sincronizar ahora" uses the same generic engine as the hourly job.
export const beginNotionSync = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const { supabase: db, userId } = context;
 const { requireAppAccess } = await import('./billing.server'); await requireAppAccess(db);
 const connection = await ownedConnection(db, userId);
 const runId = await startSync(db, userId, connection.id, 'manual');
 if (!runId) throw new Error('No se ha podido iniciar la sincronización.');
 return runId;
});
export const stepNotionSync = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ runId: z.string().uuid() })).handler(async ({ context, data }) => {
 const { requireAppAccess } = await import('./billing.server'); await requireAppAccess(context.supabase);
 return stepSync(context.supabase, context.userId, data.runId);
});
