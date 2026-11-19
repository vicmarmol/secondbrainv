import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getPendingApprovals = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
 if (role.error || !role.data) throw new Error('Solo el administrador puede consultar las solicitudes.');
 const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
 const { data, error } = await supabaseAdmin.from('user_approvals').select('user_id,registered_at').eq('status', 'pendiente').order('registered_at');
 if (error) throw new Error('No se han podido cargar las solicitudes.');
 return Promise.all((data ?? []).map(async row => {
  const user = await supabaseAdmin.auth.admin.getUserById(row.user_id);
  if (user.error || !user.data.user) throw new Error('No se ha podido consultar una solicitud.');
  return { userId: row.user_id, email: user.data.user.email ?? 'Sin correo', registeredAt: row.registered_at };
 }));
});

export const decideApproval = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
 .inputValidator(z.object({ userId: z.string().uuid(), decision: z.enum(['aprobado', 'rechazado']) }))
 .handler(async ({ context, data }) => {
  // The invoker RPC independently verifies admin and atomically starts the trial.
  const { error } = await context.supabase.rpc('decide_user_approval', { target_user: data.userId, decision: data.decision });
  if (error) throw new Error('No se ha podido resolver la solicitud. Puede que ya esté resuelta o que no tengas permiso.');
  return { ok: true };
 });