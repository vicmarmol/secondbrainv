import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle2, Loader2, RefreshCw, Plug, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { beginNotionSync, getNotionState, stepNotionSync, syncNotion, startNotionConnect, completeNotionConnect, disconnectNotion, type NotionState, type NotionProgress } from '@/services/notion';
import type { Connection } from '@/types/second-brain';

const fmt = (iso: string | null) => iso ? new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : 'Nunca';
export function NotionConnection({ connection, onRefresh }: { connection: Connection; onRefresh: () => Promise<void> }) {
 const fetchState = useServerFn(getNotionState);
 const begin = useServerFn(beginNotionSync);
 const step = useServerFn(stepNotionSync);
 const startConnect = useServerFn(startNotionConnect);
 const completeConnect = useServerFn(completeNotionConnect);
 const disconnect = useServerFn(disconnectNotion);
 const [state, setState] = useState<NotionState | null>(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [progress, setProgress] = useState<NotionProgress | null>(null);
 useEffect(() => { fetchState().then(setState).catch(() => setError('No se ha podido comprobar la conexión de Notion.')); }, [fetchState]);
 async function refresh() { await Promise.all([fetchState().then(setState), onRefresh()]); }
 async function connect() {
  const popup = window.open('', 'notion-oauth', 'width=600,height=720');
  if (!popup) { setError('Permite las ventanas emergentes para conectar Notion.'); return; }
  setBusy(true); setError(null);
  try {
   const { authorizationUrl } = await startConnect();
   const completion = new Promise<{ code: string; nonce: string }>((resolve, reject) => {
    const cleanup = () => { window.removeEventListener('message', listener); window.clearInterval(poll); window.clearTimeout(timeout); };
    const listener = (event: MessageEvent) => {
     if (event.origin !== window.location.origin || event.source !== popup || event.data?.connectorId !== 'notion') return;
     if (event.data?.type !== 'appUserConnectorOAuthComplete' && event.data?.type !== 'appUserConnectorOAuthFailed') return;
     cleanup();
     if (event.data.type === 'appUserConnectorOAuthComplete' && typeof event.data.code === 'string' && typeof event.data.nonce === 'string') resolve({ code: event.data.code, nonce: event.data.nonce });
     else reject(new Error('No se ha completado la autorización de Notion.'));
    };
    const poll = window.setInterval(() => { if (popup.closed) { cleanup(); reject(new Error('Has cerrado la autorización de Notion.')); } }, 500);
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error('La autorización ha caducado. Vuelve a intentarlo.')); }, 10 * 60 * 1000);
    window.addEventListener('message', listener);
   });
   popup.location.href = authorizationUrl;
   await completeConnect({ data: await completion });
   await refresh(); toast.success('Conectado a tu cuenta de Notion');
  } catch (e) { setError(e instanceof Error ? e.message : 'No se ha podido conectar Notion.'); }
  finally { popup.close(); setBusy(false); }
 }
 async function unlink() {
  setBusy(true); setError(null);
  try { await disconnect(); setProgress(null); await refresh(); toast.success('Notion desconectado'); }
  catch (e) { setError(e instanceof Error ? e.message : 'No se ha podido desconectar Notion.'); }
  finally { setBusy(false); }
 }
 async function run() {
  setBusy(true); setError(null); setProgress(null);
  try {
   const result = await syncNotion(begin, step, setProgress);
   toast.success(`Notion: ${result.newDocuments} nuevos · ${result.updatedDocuments} actualizados · ${result.inaccessibleDocuments} sin acceso`);
  } catch (e) { setError(e instanceof Error ? e.message : 'No se ha podido sincronizar Notion.'); }
  finally {
   await Promise.all([fetchState().then(setState).catch(() => undefined), onRefresh().catch(() => undefined)]);
   setBusy(false);
  }
 }
 const active = state?.runs.some(r => r.status === 'en_curso');
 const connected = connection.status === 'Conectado' && state?.configured === true;
 return <li className="rounded-lg border border-border bg-card p-4">
  <div className="flex flex-wrap items-center gap-4">
   <div className="min-w-0 flex-1">
     <div className="flex items-center gap-2 font-medium">Notion <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{connection.status}</span></div>
    <div className="mt-1 text-xs text-muted-foreground">{connection.documentCount} documentos · Última sincronización: {fmt(connection.lastSync)}</div>
   </div>
    <div className="flex flex-wrap gap-2">
     {connected && <Button variant="outline" size="sm" disabled={busy} onClick={run}>{busy ? <Loader2 className="animate-spin"/> : <RefreshCw/>}{active ? 'Reanudar sincronización' : state?.hasMore ? 'Continuar sincronización' : 'Sincronizar ahora'}</Button>}
     {!connected && <Button size="sm" disabled={busy || !state} onClick={connect}>{busy ? <Loader2 className="animate-spin"/> : <Plug/>}Conectar</Button>}
     {(connected || connection.status === 'Conectado') && <Button variant="ghost" size="sm" disabled={busy} onClick={unlink}><Unplug/>Desconectar</Button>}
    </div>
  </div>
   {busy && progress && <div role="status" className="mt-4 space-y-2"><div className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin"/>{`${progress.processed} de un máximo de 50 páginas · ${progress.newDocuments} nuevos · ${progress.updatedDocuments} actualizados`}</div><progress className="h-1.5 w-full accent-primary" max={50} value={progress.processed}/></div>}
  {progress?.done && !progress.error && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="size-4 shrink-0"/>{progress.newDocuments} documentos nuevos · {progress.updatedDocuments} actualizados · {progress.inaccessibleDocuments} sin acceso</p>}
  {(state?.hasMore || progress?.hasMore) && <p className="mt-3 text-sm text-muted-foreground">Quedan páginas por revisar. Continúa en la siguiente sincronización.</p>}
  {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  {!!state?.runs.length && <div className="mt-4 border-t border-border pt-3"><h2 className="text-xs font-medium text-muted-foreground">Últimas sincronizaciones</h2><ul className="mt-2 space-y-2">{state.runs.map(r => <li key={r.id} className="flex flex-wrap justify-between gap-2 text-xs"><span>{fmt(r.started_at)}</span><span className={r.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>{r.status === 'completada' ? `${r.new_documents} nuevos · ${r.updated_documents} actualizados · ${r.inaccessible_documents} sin acceso` : r.status === 'error' ? r.error_message ?? 'Error' : 'En curso'}</span></li>)}</ul></div>}
 </li>;
}