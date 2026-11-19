import { describe, expect, it, vi } from 'vitest';
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({ middleware() { return this; }, inputValidator() { return this; }, handler(fn: unknown) { return fn; } }) }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
import { getPendingApprovals, decideApproval } from './approval.functions';
const list = getPendingApprovals as unknown as (args: unknown) => Promise<unknown>;
const decide = decideApproval as unknown as (args: unknown) => Promise<unknown>;
describe('admin approval authorization', () => {
 it('does not allow a normal user to list pending users or emails', async () => {
  await expect(list({ context: { userId: 'user', supabase: { rpc: async () => ({ data: false, error: null }) } } })).rejects.toThrow('Solo el administrador');
 });
 it('surfaces a database denial instead of reporting an approval', async () => {
  const rpc = vi.fn(async () => ({ error: { message: 'Admin required' } }));
  await expect(decide({ context: { supabase: { rpc } }, data: { userId: 'target', decision: 'aprobado' } })).rejects.toThrow('No se ha podido resolver');
  expect(rpc).toHaveBeenCalledWith('decide_user_approval', { target_user: 'target', decision: 'aprobado' });
 });
});