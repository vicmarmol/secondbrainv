import { supabase } from '@/integrations/supabase/client';
import type { IndexingCounts } from '@/lib/onboarding';

const count = (r: { count: number | null; error: unknown }) => { if (r.error || r.count === null) throw new Error('No se ha podido comprobar tu espacio.'); return r.count; };

export async function getIndexingCounts(): Promise<IndexingCounts> {
 const [a, r, s, c] = await Promise.all([
  supabase.from('connections').select('id', { count: 'exact', head: true }).eq('status', 'conectado'),
  supabase.from('sync_runs').select('id', { count: 'exact', head: true }).eq('status', 'completada'),
  supabase.from('documents').select('id', { count: 'exact', head: true }).eq('is_sample', true),
  supabase.from('conversations').select('id', { count: 'exact', head: true }),
 ]);
 return { activeConnections: count(a), completedRuns: count(r), sampleDocuments: count(s), conversations: count(c) };
}

/** Live counter for the first sync: readable owned real documents vs. pages Notion did not share. */
export async function getIndexedDocuments() {
 const [ok, blocked] = await Promise.all([
  supabase.from('documents').select('id', { count: 'exact', head: true }).eq('is_sample', false).eq('inaccessible', false),
  supabase.from('documents').select('id', { count: 'exact', head: true }).eq('is_sample', false).eq('inaccessible', true),
 ]);
 return { indexed: count(ok), inaccessible: count(blocked) };
}
