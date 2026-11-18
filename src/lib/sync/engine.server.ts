import type { Db, SyncProgress, SyncTrigger } from './types';
import { connectorFor } from './registry.server';

const LEASE_MS = 90_000;
const STALE_MS = 30 * 60_000;
function checked<T>(result: { data: T; error: unknown }): T {
 if (result.error) throw new Error('No se ha podido guardar la sincronización.');
 return result.data;
}

/** Starts (or resumes) a run. Automatic runs skip connections that are already syncing. */
export async function startSync(db: Db, userId: string, connectionId: string, trigger: SyncTrigger): Promise<string | null> {
 const connection = checked(await db.from('connections').select('*').eq('id', connectionId).eq('user_id', userId).single());
 const connector = connection && connectorFor(connection.source);
 if (!connection || !connector) throw new Error('Esta fuente todavía no se puede sincronizar.');
 if (connection.status !== 'conectado' || !await connector.isReady(userId)) throw new Error('Conecta tu propia cuenta antes de sincronizar.');
 const existing = checked(await db.from('sync_runs').select('id,started_at').eq('connection_id', connection.id).eq('user_id', userId).eq('status', 'en_curso').maybeSingle());
 if (existing) {
  if (trigger === 'manual') return existing.id;
  // A run abandoned long ago (closed tab) is resumed by the job; a live one is skipped.
  return Date.now() - Date.parse(existing.started_at) > STALE_MS ? existing.id : null;
 }
 const run = checked(await db.from('sync_runs').insert({ user_id: userId, connection_id: connection.id, status: 'en_curso', trigger, progress: connector.initialProgress(connection) as never }).select('id').single());
 if (!run) throw new Error('No se ha podido iniciar la sincronización.');
 return run.id;
}

/** One step of any source. Shared by "Sincronizar ahora" and the hourly job. */
export async function stepSync(db: Db, userId: string, runId: string): Promise<SyncProgress> {
 const run = checked(await db.from('sync_runs').select('*').eq('id', runId).eq('user_id', userId).single());
 if (!run) throw new Error('Sincronización no disponible.');
 const idle = { done: true, processed: 0, newDocuments: run.new_documents, updatedDocuments: run.updated_documents, inaccessibleDocuments: run.inaccessible_documents ?? 0, hasMore: false, error: run.error_message };
 if (run.status !== 'en_curso') return idle;
 // Lease: only one worker advances a run at a time.
 const now = new Date();
 const claimed = checked(await db.from('sync_runs').update({ lease_until: new Date(now.getTime() + LEASE_MS).toISOString() })
  .eq('id', run.id).eq('user_id', userId).eq('status', 'en_curso').or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`).select('*'));
 const current = claimed?.[0];
 if (!current) { await new Promise(r => setTimeout(r, 1000)); return { ...idle, done: false, hasMore: true, error: null }; }
 const connection = checked(await db.from('connections').select('*').eq('id', current.connection_id).eq('user_id', userId).single());
 const connector = connection && connectorFor(connection.source);
 if (!connection || !connector) throw new Error('Esta fuente todavía no se puede sincronizar.');
 try {
  if (connection.status !== 'conectado' || !await connector.isReady(userId)) throw new Error('Conecta tu propia cuenta antes de sincronizar.');
  const outcome = await connector.step({ db, userId, run: current, connection });
  if (!outcome.done) await db.from('sync_runs').update({ lease_until: null }).eq('id', run.id).eq('user_id', userId);
  else await db.from('connections').update({ attention_message: null }).eq('id', connection.id).eq('user_id', userId);
  return { ...outcome, error: null };
 } catch (error) {
  const { message, disconnect } = connector.describeError(error);
  await db.from('connections').update({ attention_message: message, ...(disconnect ? { status: 'desconectado' as const } : {}) }).eq('id', connection.id).eq('user_id', userId);
  const latest = checked(await db.from('sync_runs').select('new_documents,updated_documents').eq('id', run.id).single());
  await db.from('sync_runs').update({ status: 'error', finished_at: new Date().toISOString(), error_message: message, lease_until: null }).eq('id', run.id).eq('user_id', userId);
  return { done: true, processed: 0, newDocuments: latest?.new_documents ?? 0, updatedDocuments: latest?.updated_documents ?? 0, inaccessibleDocuments: run.inaccessible_documents ?? 0, hasMore: false, error: message };
 }
}
