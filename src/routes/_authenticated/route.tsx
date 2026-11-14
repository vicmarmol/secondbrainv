import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getBilling } from '@/services/billing';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated')({
 ssr: false,
 beforeLoad: async ({ location }) => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw redirect({ to: '/auth' });
  const billing = await getBilling();
  if (!billing.hasAccess && location.pathname !== '/suscripcion') throw redirect({ to: '/suscripcion' });
  return { user: data.user };
 },
 component: () => <Outlet/>,
});
