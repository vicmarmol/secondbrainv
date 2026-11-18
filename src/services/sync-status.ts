import { supabase } from '@/integrations/supabase/client';
import type { SyncHealthConnection } from '@/lib/sync-status';

const RUN_FRESH_MS = 30 * 60 * 1000;

/** Solo lee el estado guardado (conexiones y sync_runs); no llama a ninguna fuente. */
export async function getSyncHealthConnections(now = Date.now()): Promise<SyncHealthConnection[]> {
 const { data: conns, error } = await supabase.from('connections').select('id,provider,attention_message').eq('status', 'conectado').order('created_at');
 if (error) throw new Error('No se ha podido leer el estado de las conexiones.');
 if (!conns?.length) return [];
 const { data: runs } = await supabase.from('sync_runs').select('connection_id,status,trigger,started_at,finished_at,lease_until').eq('is_sample', false).in('connection_id', conns.map(c => c.id)).order('started_at', { ascending: false }).limit(200);
 return conns.map(c => {
  const mine = (runs ?? []).filter(r => r.connection_id === c.id);
  const ok = mine.filter(r => r.status === 'completada' && r.finished_at).sort((a, b) => b.finished_at!.localeCompare(a.finished_at!))[0];
  const running = mine.some(r => r.status === 'en_curso' && (Date.parse(r.lease_until ?? '') > now || now - Date.parse(r.started_at) < RUN_FRESH_MS));
  const lastDone = mine.find(r => r.status !== 'en_curso');
  return { id: c.id, name: c.provider, lastOk: ok?.finished_at ?? null, lastOkTrigger: (ok?.trigger as 'manual' | 'automatica' | undefined) ?? null, running, failed: !!c.attention_message || lastDone?.status === 'error' };
 });
}
