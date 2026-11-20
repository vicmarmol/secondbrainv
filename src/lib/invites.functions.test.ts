import { describe, expect, it, vi } from 'vitest';
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({ middleware() { return this; }, inputValidator() { return this; }, handler(fn: unknown) { return fn; } }) }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
import { getInvitePanel, manageInviteCode } from './invites.functions';
const list = getInvitePanel as unknown as (args: unknown) => Promise<unknown>;
const manage = manageInviteCode as unknown as (args: unknown) => Promise<unknown>;
describe('invitation authorization', () => {
 it('blocks normal users before reading any code or recipient email', async () => {
  const from = vi.fn();
  await expect(list({ context: { userId: 'user', supabase: { from, rpc: async () => ({ data: false, error: null }) } } })).rejects.toThrow('Solo el administrador');
  expect(from).not.toHaveBeenCalled();
 });
 it('passes the confirmed active id to the server for atomic replacement', async () => {
  const rpc = vi.fn(async () => ({ error: null }));
  await manage({ context: { supabase: { rpc } }, data: { action: 'generate', expectedActiveId: 'active-id' } });
  expect(rpc).toHaveBeenCalledWith('manage_invite_code', { action: 'generate', expected_active_id: 'active-id' });
 });
 it('does not report success when database authorization fails', async () => {
  await expect(manage({ context: { supabase: { rpc: async () => ({ error: { message: 'Admin required' } }) } }, data: { action: 'deactivate', expectedActiveId: null } })).rejects.toThrow('No se ha podido cambiar');
 });
});