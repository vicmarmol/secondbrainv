import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Connection, Source } from '@/types/second-brain';

type Row = Database['public']['Tables']['connections']['Row'];
const statusLabel: Record<Row['status'], Connection['status']> = { conectado: 'Conectado', desconectado: 'Desconectado', proximamente: 'Próximamente' };
const sourceById: Record<string, Source> = { notion: 'Notion', drive: 'Drive', dropbox: 'Dropbox', granola: 'Granola', garmin: 'Garmin', gmail: 'Gmail', whatsapp: 'WhatsApp' };

export function toConnection(row: Row): Connection {
 return { id: row.id, name: row.provider, source: sourceById[row.source] ?? 'Subidos manualmente', status: statusLabel[row.status], lastSync: row.last_synced_at, documentCount: row.document_count, attention: row.attention_message };
}

export async function getConnections(): Promise<Connection[]> {
 const { data, error } = await supabase.from('connections').select('*').order('created_at').order('source');
 if (error) throw new Error('No se han podido cargar las conexiones.');
 const runs = (await supabase.from('sync_runs').select('connection_id,trigger').eq('status', 'completada').order('finished_at', { ascending: false }).limit(100)).data ?? [];
 return (data ?? []).map(row => ({ ...toConnection(row), lastSyncTrigger: (runs.find(r => r.connection_id === row.id)?.trigger as 'manual' | 'automatica' | undefined) ?? null }));
}

async function update(id: string, values: Partial<Pick<Row, 'status' | 'last_synced_at'>>) {
 const { data, error } = await supabase.from('connections').update(values).eq('id', id).select('*').single();
 if (error || !data) throw new Error('No se ha podido actualizar la conexión.');
 return toConnection(data);
}
export const setConnected = (id: string, connected: boolean) => update(id, { status: connected ? 'conectado' : 'desconectado' });
export const syncNow = (id: string) => update(id, { last_synced_at: new Date().toISOString() });
