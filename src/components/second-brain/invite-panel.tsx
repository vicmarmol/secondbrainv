import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Copy, KeyRound, Plus, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { invitePanelOptions, manageInviteCode } from '@/services/invites';

const date = (value: string) => new Date(value).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
const displayCode = (value: string) => `${value.slice(0, 4)}-${value.slice(4)}`;

export function InvitePanel() {
 const query = useQuery(invitePanelOptions);
 const queryClient = useQueryClient();
 const manage = useServerFn(manageInviteCode);
 const [busy, setBusy] = useState(false);
 const [confirmId, setConfirmId] = useState<string | null>(null);
 const active = query.data?.codes.find(code => code.active);
 const latest = active ?? query.data?.codes[0];
 async function change(action: 'generate' | 'deactivate', expectedActiveId: string | null) {
  setBusy(true);
  try {
   await manage({ data: { action, expectedActiveId } });
   toast.success(action === 'generate' ? 'Código de invitación generado.' : 'Código desactivado.');
  } catch (error) { toast.error(error instanceof Error ? error.message : 'No se ha podido cambiar el código.'); }
  finally { await queryClient.invalidateQueries({ queryKey: invitePanelOptions.queryKey }); setBusy(false); }
 }
 async function copy() {
  if (!active) return;
  try { await navigator.clipboard.writeText(displayCode(active.code)); toast.success('Código copiado.'); }
  catch { toast.error('No se ha podido copiar el código.'); }
 }
 return <section className="mt-6 border-b border-border pb-5" aria-label="Código de invitación">
  <h2 className="flex items-center gap-2 font-medium"><KeyRound className="size-4 text-primary"/>Código de invitación</h2>
  {query.isPending ? <p className="mt-3 text-sm text-muted-foreground">Cargando código…</p> : query.error ? <div className="mt-3"><p role="alert" className="text-sm">{query.error.message}</p><Button variant="outline" className="mt-3" onClick={() => query.refetch()}>Reintentar</Button></div> : <>
   <p className={active ? 'mt-4 font-mono text-2xl font-semibold text-primary' : 'mt-4 text-sm text-muted-foreground'}>{active ? displayCode(active.code) : 'Sin código activo'}</p>
   {latest && <p className="mt-2 text-xs text-muted-foreground">{active ? 'Creación' : 'Último código (desactivado)'}: {date(latest.created_at)} · {latest.uses} usos</p>}
   <div className="mt-4 flex flex-wrap gap-2">
    <Button size="sm" disabled={busy || query.isFetching} onClick={() => active ? setConfirmId(active.id) : change('generate', null)}><Plus/>Generar código nuevo</Button>
    <Button size="sm" variant="outline" disabled={busy || !active} onClick={copy}><Copy/>Copiar</Button>
    <Button size="sm" variant="outline" disabled={busy || !active} onClick={() => change('deactivate', active?.id ?? null)}><Ban/>Desactivar</Button>
   </div>
   <h3 className="mt-5 text-sm font-medium">Historial de usos</h3>
   {!query.data?.history.length ? <p className="mt-2 text-sm text-muted-foreground">Todavía no se ha usado ningún código.</p> : <ul className="mt-2 divide-y divide-border">{query.data.history.map(use => <li key={`${use.codeId}-${use.usedAt}-${use.email}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="min-w-0 break-all">{use.email}</span><span className="text-xs text-muted-foreground">{date(use.usedAt)} · {use.codeId === active?.id ? 'Código actual' : 'Código anterior'}</span></li>)}</ul>}
  </>}
  <AlertDialog open={confirmId !== null} onOpenChange={open => { if (!open) setConfirmId(null); }}>
   <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Generar un código nuevo?</AlertDialogTitle><AlertDialogDescription>El código actual dejará de funcionar para todas las personas con las que lo hayas compartido. Las cuentas ya aprobadas no cambian.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (confirmId) void change('generate', confirmId); }}>Generar código nuevo</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
  </AlertDialog>
 </section>;
}