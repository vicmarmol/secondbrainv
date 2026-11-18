import { describe, expect, it, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({ state: { freeAccess: false, hasAccess: false, calls: [] as string[] } }));
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({ middleware() { return this; }, inputValidator() { return this; }, handler(fn: unknown) { return fn; } }) }));
vi.mock('@tanstack/react-start/server', () => ({ getRequest: () => new Request('https://secondbrain.example/suscripcion') }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
vi.mock('./stripe.server', () => ({ createStripeClient: () => { throw new Error('Checkout must not start'); }, getStripeErrorMessage: (error: Error) => error.message }));
import { getBillingState, startSubscriptionCheckout } from './billing.functions';

const db = {
 rpc: async (name: string) => {
  state.calls.push(name);
  return { data: name === 'has_role' ? state.freeAccess : name === 'has_app_access' ? state.hasAccess : { started_at: '2026-11-01T00:00:00Z', ends_at: '2026-11-08T00:00:00Z' }, error: null };
 },
 from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }) }) }),
};
type StateResult = { hasAccess: boolean; freeAccess: boolean; trial: { ends_at: string } };
const billingState = getBillingState as unknown as (args: unknown) => Promise<StateResult>;
const checkout = startSubscriptionCheckout as unknown as (args: unknown) => Promise<{ error: string }>;
const args = { context: { supabase: db, userId: 'owner' }, data: { environment: 'sandbox' } };
beforeEach(() => { state.calls = []; state.freeAccess = false; state.hasAccess = false; });

describe('server-owned billing entitlements', () => {
 it('returns free permanent access for an admin with an expired trial without returning roles', async () => {
  state.freeAccess = true; state.hasAccess = true;
  const result = await billingState(args);
  expect(Date.parse(result.trial.ends_at)).toBeLessThan(Date.parse('2026-11-18T00:00:00Z'));
  expect(result.freeAccess).toBe(true);
  expect(result.hasAccess).toBe(true);
  expect(result).not.toHaveProperty('role');
  expect(result).not.toHaveProperty('roles');
  expect(state.calls).toContain('has_role');
 });
 it('keeps a user with an expired trial and no subscription blocked', async () => {
  const result = await billingState(args);
  expect(result.hasAccess).toBe(false);
  expect(result.freeAccess).toBe(false);
 });
 it('does not create a checkout for free-access accounts', async () => {
  state.freeAccess = true;
  const result = await checkout(args);
  expect(result.error).toBe('Tu cuenta tiene acceso gratuito y no necesita suscripción.');
 });
});