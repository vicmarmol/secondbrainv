import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@tanstack/react-router', () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock('@/integrations/supabase/client.server', () => ({ supabaseAdmin: {} }));
vi.mock('./scheduler.server', () => ({ startScheduledRuns: vi.fn(async () => ({ started: 1 })), advanceScheduledRuns: vi.fn(async () => false) }));
import { Route } from '@/routes/api/public/jobs/sync-connections';
import { startScheduledRuns, advanceScheduledRuns } from './scheduler.server';
const handlers = (Route as unknown as { server: { handlers: Record<'PUT' | 'POST', (args: { request: Request }) => Promise<Response>> } }).server.handlers;
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('LOVABLE_CRON_SECRET', 'test-only-cron-credential'); vi.stubEnv('LOVABLE_CRON_SECRET_PREVIOUS', ''); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function request(method: string, authorized = false) { return new Request('https://secondbrain.example/api/public/jobs/sync-connections', { method, headers: authorized ? { authorization: 'Bearer test-only-cron-credential' } : {} }); }
describe('sync callback authentication', () => {
 it('rejects external PUT without credentials before any work', async () => {
  expect((await handlers.PUT({ request: request('PUT') })).status).toBe(401);
  expect(advanceScheduledRuns).not.toHaveBeenCalled();
 });
 it('rejects an incorrect credential before any work', async () => {
  const req = new Request(request('PUT'), { headers: { authorization: 'Bearer wrong' } });
  expect((await handlers.PUT({ request: req })).status).toBe(401);
  expect(advanceScheduledRuns).not.toHaveBeenCalled();
 });
 it('allows authenticated hourly POST and passes validated authorization to the next slice', async () => {
  vi.mocked(advanceScheduledRuns).mockResolvedValueOnce(true);
  const fetcher = vi.fn(async () => new Response(null, { status: 202 })); vi.stubGlobal('fetch', fetcher);
  expect((await handlers.POST({ request: request('POST', true) })).status).toBe(200);
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledWith('https://secondbrain.example/api/public/jobs/sync-connections', { method: 'PUT', headers: { authorization: 'Bearer test-only-cron-credential' }, redirect: 'manual' }));
  expect(startScheduledRuns).toHaveBeenCalledOnce();
 });
 it('allows authenticated PUT to advance existing runs', async () => {
  expect((await handlers.PUT({ request: request('PUT', true) })).status).toBe(202);
  await vi.waitFor(() => expect(advanceScheduledRuns).toHaveBeenCalledOnce());
 });
});