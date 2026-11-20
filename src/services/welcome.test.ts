import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectWelcomeNotion, getWelcomeCounts } from './welcome';

const db = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: db }));

describe('Welcome counts use owned rows with no sample/visibility filters', () => {
 it('only counts connected rows and counts all documents, including samples', async () => {
  const eq = vi.fn(async () => ({ count: 0, error: null }));
  const connectionsSelect = vi.fn(() => ({ eq }));
  const documentsSelect = vi.fn(async () => ({ count: 20, error: null }));
  db.from.mockImplementation((table: string) => ({ select: table === 'connections' ? connectionsSelect : documentsSelect }));
  expect(await getWelcomeCounts()).toEqual({ activeConnections: 0, documents: 20 });
  expect(eq).toHaveBeenCalledExactlyOnceWith('status', 'conectado');
  expect(documentsSelect).toHaveBeenCalledExactlyOnceWith('id', { count: 'exact', head: true });
 });
 it('fails closed rather than treating a failed count as an empty account', async () => {
  db.from.mockReturnValue({ select: () => ({ count: null, error: null, eq: async () => ({ count: null, error: { message: 'offline' } }) }) });
  await expect(getWelcomeCounts()).rejects.toThrow();
 });
});

describe('Welcome reuses the Notion popup callback contract', () => {
 let popup: Window;
 beforeEach(() => {
  vi.useFakeTimers();
  popup = { closed: false, location: { href: '' }, close: vi.fn() } as unknown as Window;
  vi.spyOn(window, 'open').mockReturnValue(popup);
 });
 afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
 it('exchanges once only for this popup, origin and connector, before completing', async () => {
  const start = vi.fn(async () => ({ authorizationUrl: 'https://example.com/consent' }));
  const complete = vi.fn(async () => undefined);
  const promise = connectWelcomeNotion(start, complete);
  await Promise.resolve();
  const data = { type: 'appUserConnectorOAuthComplete', connectorId: 'notion', code: 'one-time', nonce: 'nonce' };
  window.dispatchEvent(new MessageEvent('message', { origin: 'https://other.example', source: popup, data }));
  window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: window, data }));
  window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: popup, data: { ...data, connectorId: 'drive' } }));
  expect(complete).not.toHaveBeenCalled();
  window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: popup, data }));
  await promise;
  expect(start).toHaveBeenCalledOnce();
  expect(complete).toHaveBeenCalledExactlyOnceWith({ data: { code: 'one-time', nonce: 'nonce', mode: 'connect' } });
  expect(popup.close).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
 });
 it('cancellation never exchanges credentials and cleans up listeners/timers', async () => {
  const complete = vi.fn(async () => undefined);
  const promise = connectWelcomeNotion(async () => ({ authorizationUrl: 'https://example.com/consent' }), complete);
  const rejection = expect(promise).rejects.toThrow();
  await Promise.resolve();
  Object.defineProperty(popup, 'closed', { value: true });
  await vi.advanceTimersByTimeAsync(500); await rejection;
  expect(complete).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
 });
 it('a failed authorization does not exchange or mark the source connected', async () => {
  const complete = vi.fn(async () => undefined);
  const promise = connectWelcomeNotion(async () => ({ authorizationUrl: 'https://example.com/consent' }), complete);
  const rejection = expect(promise).rejects.toThrow();
  await Promise.resolve();
  window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: popup, data: { type: 'appUserConnectorOAuthFailed', connectorId: 'notion' } }));
  await rejection; expect(complete).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
 });
});