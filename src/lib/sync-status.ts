import { timeAgo } from './relative-time';

export type SyncHealthKind = 'ok' | 'syncing' | 'stale' | 'attention' | 'none';
export interface SyncHealthConnection { id: string; name: string; lastOk: string | null; lastOkTrigger: 'manual' | 'automatica' | null; running: boolean; failed: boolean }
export interface SyncHealth { kind: SyncHealthKind; label: string }

export const STALE_MS = 2 * 60 * 60 * 1000;

/** Estado del indicador de cabecera. Prioridad: atención > sincronizando > sin sincronizar > al día. */
export function syncHealth(conns: SyncHealthConnection[], now = Date.now()): SyncHealth {
 if (!conns.length) return { kind: 'none', label: 'Sin conexiones' };
 if (conns.some(c => c.failed)) return { kind: 'attention', label: 'Requiere atención' };
 if (conns.some(c => c.running)) return { kind: 'syncing', label: 'Sincronizando…' };
 const stale = conns.filter(c => !c.lastOk || now - Date.parse(c.lastOk) > STALE_MS);
 if (stale.length) {
  const oldest = stale.some(c => !c.lastOk) ? null : stale.map(c => c.lastOk!).sort()[0];
  return { kind: 'stale', label: oldest ? `${timeAgo(oldest, now).replace(/^hace/, 'Hace')} sin sincronizar` : 'Nunca sincronizado' };
 }
 return { kind: 'ok', label: 'Todo al día' };
}
