import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { decideApproval, pendingApprovalsOptions } from '@/services/approval';

export function ApprovalRequests() {
 const query = useQuery(pendingApprovalsOptions);
 const queryClient = useQueryClient();
 const decide = useServerFn(decideApproval);
 const [busy, setBusy] = useState<string | null>(null);
 async function resolve(userId: string, decision: 'aprobado' | 'rechazado') {
  setBusy(userId);
  try {
   await decide({ data: { userId, decision } });
   toast.success(decision === 'aprobado' ? 'Cuenta aprobada. Su prueba de 7 días empieza ahora.' : 'Solicitud rechazada.');
   await queryClient.invalidateQueries({ queryKey: pendingApprovalsOptions.queryKey });
  } catch (e) { toast.error(e instanceof Error ? e.message : 'No se ha podido resolver la solicitud.'); }
  finally { setBusy(null); }
 }
 return <section className="mt-6 border-y border-border py-5">
  <h2 className="font-medium">Solicitudes pendientes <span className="text-muted-foreground">({query.data?.length ?? 0})</span></h2>
  {query.isPending ? <p className="mt-3 text-sm text-muted-foreground">Cargando solicitudes…</p> : query.error ? <div className="mt-3"><p role="alert" className="text-sm">{query.error.message}</p><Button variant="outline" className="mt-3" onClick={() => query.refetch()}>Reintentar</Button></div> : !query.data?.length ? <p className="mt-3 text-sm text-muted-foreground">No hay solicitudes pendientes.</p> : <ul className="mt-3 divide-y divide-border">{query.data.map(user => <li key={user.userId} className="flex flex-wrap items-center justify-between gap-3 py-4">
   <div className="min-w-0"><p className="break-all text-sm font-medium">{user.email}</p><p className="mt-1 text-xs text-muted-foreground">Registro: {new Date(user.registeredAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p></div>
   <div className="flex gap-2"><Button size="sm" disabled={busy !== null} onClick={() => resolve(user.userId, 'aprobado')}><Check/>Aprobar</Button><Button size="sm" variant="outline" disabled={busy !== null} onClick={() => resolve(user.userId, 'rechazado')}><X/>Rechazar</Button></div>
  </li>)}</ul>}
 </section>;
}