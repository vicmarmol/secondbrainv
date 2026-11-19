import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Brain, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBilling } from '@/services/billing';
import { signOut } from '@/services';
import { setViewAs } from '@/lib/view-as';

export function ApprovalWaiting() {
 const queryClient = useQueryClient();
 const navigate = useNavigate();
 const query = useQuery({ queryKey: ['billing'], queryFn: getBilling, refetchInterval: 10000 });
 useEffect(() => {
  if (query.data?.freeAccess || query.data?.approvalStatus === 'aprobado') navigate({ to: query.data.hasAccess ? '/' : '/suscripcion', replace: true });
 }, [query.data, navigate]);
 async function logout() {
  setViewAs(null);
  await queryClient.cancelQueries(); queryClient.clear();
  await signOut(); navigate({ to: '/auth', replace: true });
 }
 const rejected = query.data?.approvalStatus === 'rechazado';
 return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
  <div className="w-full max-w-lg">
   <div className="mb-8 flex items-center gap-3 text-primary"><Brain size={26}/><span className="text-xl font-semibold">Second Brain</span></div>
   <h1 className="text-2xl font-semibold">{rejected ? 'Tu cuenta no tiene acceso' : 'Tu cuenta está pendiente de aprobación.'}</h1>
   <p className="mt-4 text-muted-foreground">{rejected ? 'Tu solicitud de acceso ha sido rechazada.' : 'Te avisaremos cuando puedas entrar'}</p>
   {!rejected && <p className="mt-3 text-sm text-muted-foreground">Tu prueba de 7 días empezará cuando se apruebe tu cuenta.</p>}
   {query.error && <p role="alert" className="mt-4 text-sm">No se ha podido comprobar tu aprobación.</p>}
   <Button variant="outline" className="mt-8" onClick={logout}><LogOut/>Cerrar sesión</Button>
  </div>
 </main>;
}