import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getInvitePanel = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
 if (role.error || !role.data) throw new Error('Solo el administrador puede consultar las invitaciones.');
 const codes = await context.supabase.from('invite_codes').select('id,code,active,created_at,uses').order('created_at', { ascending: false });
 if (codes.error) throw new Error('No se han podido cargar los códigos.');
 const uses = await context.supabase.from('invite_code_uses').select('invite_code_id,user_id,used_at').order('used_at', { ascending: false });
 if (uses.error) throw new Error('No se han podido cargar los usos.');
 // Only after verifying admin may privileged auth reads resolve recipient emails.
 const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
 const history = await Promise.all((uses.data ?? []).map(async use => {
  const result = await supabaseAdmin.auth.admin.getUserById(use.user_id);
  return { codeId: use.invite_code_id, usedAt: use.used_at, email: result.data.user?.email ?? 'Cuenta eliminada' };
 }));
 return { codes: codes.data ?? [], history };
});

export const manageInviteCode = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
 .inputValidator(z.object({ action: z.enum(['generate', 'deactivate']), expectedActiveId: z.string().uuid().nullable() }))
 .handler(async ({ context, data }) => {
  const result = await context.supabase.rpc('manage_invite_code', { action: data.action, ...(data.expectedActiveId === null ? {} : { expected_active_id: data.expectedActiveId }) });
  if (result.error) throw new Error('No se ha podido cambiar el código. Actualiza el panel y vuelve a intentarlo.');
  return { ok: true };
 });