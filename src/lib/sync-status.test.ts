import { describe, expect, it } from 'vitest';
import { syncHealth, type SyncHealthConnection } from './sync-status';
const now = Date.parse('2026-11-18T20:00:00Z');
const c = (o: Partial<SyncHealthConnection> = {}): SyncHealthConnection => ({ id: '1', name: 'Notion', lastOk: '2026-11-18T19:30:00Z', lastOkTrigger: 'automatica', running: false, failed: false, ...o });
describe('syncHealth', () => {
 it('sin conexiones activas → gris', () => expect(syncHealth([], now).kind).toBe('none'));
 it('última correcta hace menos de 2 horas → al día', () => expect(syncHealth([c()], now)).toEqual({ kind: 'ok', label: 'Todo al día' }));
 it('más de 2 horas → ámbar con el tiempo', () => expect(syncHealth([c({ lastOk: '2026-11-18T17:00:00Z' })], now)).toEqual({ kind: 'stale', label: 'Hace 3 horas sin sincronizar' }));
 it('sincronización en curso → azul', () => expect(syncHealth([c({ lastOk: '2026-11-18T10:00:00Z', running: true })], now).kind).toBe('syncing'));
 it('error gana a todo', () => expect(syncHealth([c({ running: true }), c({ failed: true })], now).kind).toBe('attention'));
});
