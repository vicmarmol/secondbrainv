import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./registry.server', () => ({ registeredSources: ['notion'] }));
vi.mock('./engine.server', () => ({ startSync: vi.fn(async () => ({})), stepSync: vi.fn() }));
import { startSync } from './engine.server';
import { startScheduledRuns } from './scheduler.server';
import type { Db } from './types';
function db(status: string, admin = false): Db {
 return { from(table: string) {
  const data = table === 'connections' ? [{ id: 'connection', user_id: 'owner' }] : table === 'user_roles' ? [{ role: admin ? 'admin' : 'user' }] : table === 'user_approvals' ? { status } : table === 'app_trials' ? { ends_at: '2099-01-01T00:00:00Z' } : [];
  const builder = { select() { return this; }, eq() { return this; }, in: async () => ({ data, error: null }), maybeSingle: async () => ({ data, error: null }), then(resolve: (r: unknown) => unknown) { return Promise.resolve({ data, error: null }).then(resolve); } };
  return builder;
 } } as unknown as Db;
}
beforeEach(() => vi.clearAllMocks());
describe('scheduled approval gate', () => {
 it('skips pending connections even with a future trial', async () => { expect((await startScheduledRuns(db('pendiente'))).skipped).toBe(1); expect(startSync).not.toHaveBeenCalled(); });
 it('skips rejected connections even with a future trial', async () => { expect((await startScheduledRuns(db('rechazado'))).skipped).toBe(1); expect(startSync).not.toHaveBeenCalled(); });
 it('starts approved connections', async () => { expect((await startScheduledRuns(db('aprobado'))).started).toBe(1); });
 it('keeps admin connections eligible regardless of approval', async () => { expect((await startScheduledRuns(db('pendiente', true))).started).toBe(1); });
});