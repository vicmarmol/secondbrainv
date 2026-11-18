import { paidAccess, trialAccess } from '../billing';
import { registeredSources } from './registry.server';
import { startSync, stepSync } from './engine.server';
import type { Db } from './types';

const SLICE_MS = 20_000;

async function hasAccess(db: Db, userId: string) {
 const roles = (await db.from('user_roles').select('role').eq('user_id', userId)).data ?? [];
 if (roles.some(r => r.role === 'admin')) return true;
 if (!roles.some(r => r.role === 'user')) return false;
 const trial = (await db.from('app_trials').select('ends_at').eq('user_id', userId).maybeSingle()).data;
 if (trial && trialAccess(trial.ends_at)) return true;
 const subs = (await db.from('subscriptions').select('status,current_period_end,price_id').eq('user_id', userId).eq('environment', 'live')).data ?? [];
 return subs.some(s => paidAccess(s));
}

/** Hourly tick: start an automatic run for every active connection of a registered source. */
export async function startScheduledRuns(db: Db) {
 const { data, error } = await db.from('connections').select('id,user_id').eq('status', 'conectado').in('source', registeredSources);
 if (error) throw error;
 let started = 0, skipped = 0, failed = 0;
 for (const c of data ?? []) {
  try {
   if (!await hasAccess(db, c.user_id)) { skipped++; continue; }
   (await startSync(db, c.user_id, c.id, 'automatica')) ? started++ : skipped++;
  } catch (e) {
   failed++;
   const message = e instanceof Error ? e.message : 'No se ha podido iniciar la sincronización.';
   await db.from('connections').update({ attention_message: message }).eq('id', c.id);
   await db.from('sync_runs').insert({ user_id: c.user_id, connection_id: c.id, status: 'error', trigger: 'automatica', error_message: message, finished_at: new Date().toISOString() });
  }
 }
 return { connections: data?.length ?? 0, started, skipped, failed };
}

/** Advance pending automatic (or abandoned) runs for a bounded slice. Returns true when work remains. */
export async function advanceScheduledRuns(db: Db) {
 const deadline = Date.now() + SLICE_MS;
 const staleBefore = new Date(Date.now() - 30 * 60_000).toISOString();
 for (;;) {
  const { data } = await db.from('sync_runs').select('id,user_id').eq('status', 'en_curso').or(`trigger.eq.automatica,started_at.lt.${staleBefore}`).order('started_at').limit(20);
  if (!data?.length) return false;
  for (const run of data) {
   if (Date.now() > deadline) return true;
   // A failure is recorded on that run; the loop continues with the others.
   await stepSync(db, run.user_id, run.id).catch(e => console.error('scheduled sync step failed', e instanceof Error ? e.message : e));
  }
  if (Date.now() > deadline) return true;
 }
}
