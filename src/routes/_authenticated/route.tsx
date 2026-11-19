import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router';
import { getBilling } from '@/services/billing';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

/** Network hiccups (e.g. "Failed to fetch") are retried instead of blanking the app. */
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
 for (let i = 0; ; i++) {
  try { return await fn(); }
  catch (e) { if (i >= tries - 1 || !(e instanceof TypeError)) throw e; await new Promise(r => setTimeout(r, 800 * (i + 1))); }
 }
}

export const Route = createFileRoute('/_authenticated')({
 ssr: false,
 beforeLoad: async ({ location }) => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw redirect({ to: '/auth' });
  const billing = await withRetry(getBilling);
  if (!billing.freeAccess && billing.approvalStatus !== 'aprobado') {
   if (location.pathname !== '/aprobacion') throw redirect({ to: '/aprobacion' });
   return { user: data.user };
  }
  if (location.pathname === '/aprobacion') throw redirect({ to: billing.hasAccess ? '/' : '/suscripcion' });
  if (!billing.hasAccess && location.pathname !== '/suscripcion') throw redirect({ to: '/suscripcion' });
  return { user: data.user };
 },
 component: () => <Outlet/>,
 errorComponent: function AuthError() {
  const router = useRouter();
  return <div className="future-page"><h1>No se ha podido conectar</h1><p>Comprueba tu conexión e inténtalo de nuevo.</p><div className="mt-7"><Button onClick={() => router.invalidate()}>Reintentar</Button></div></div>;
 },
});
