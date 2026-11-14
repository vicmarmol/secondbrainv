import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { beginNotionSync, getNotionState, stepNotionSync, syncNotion, type NotionState, type NotionProgress } from '@/services/notion';
import type { Connection } from '@/types/second-brain';

const fmt = (iso: string | null) => iso ? new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : 'Nunca';
export function NotionConnection({ connection, onRefresh }: { connection: Connection; onRefresh: () => Promise<void> }) {
 const fetchState = useServerFn(getNotionState);
 const begin = useServerFn(beginNotionSync);
 const step = useServerFn(stepNotionSync);
 const [state, setState] = useState<NotionState | null>(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [progress, setProgress] = useState<NotionProgress | null>(null);
 useEffect(() => { fetchState().then(setState).catch(() => setError('No se ha podido comprobar la conexión de Notion.')); }, [fetchState]);
 async function run() {
  setBusy(true); setError(null); setProgress(null);
  try {
   const result = await syncNotion(begin, step, setProgress);
   toast.success(`Notion: ${result.newDocuments} nuevos · ${result.updatedDocuments} actualizados`);
  } catch (e) { setError(e instanceof Error ? e.message : 'No se ha podido sincronizar Notion.'); }
  finally {
   await Promise.all([fetchState().then(setState).catch(() => undefined), onRefresh().catch(() => undefined)]);
   setBusy(false);
  }
 }
 const active = state?.runs.some(r => r.status === 'en_curso');
 return <li className="rounded-lg border border-border bg-card p-4">
  <div className="flex flex-wrap items-center gap-4">
   <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2 font-medium">Notion <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{state ? state.configured ? 'Conectado' : 'Sin configurar' : 'Comprobando…'}</span></div>
    <div className="mt-1 text-xs text-muted-foreground">{connection.documentCount} documentos · Última sincronización: {fmt(connection.lastSync)}</div>
   </div>
   {state?.configured && <Button variant="outline" size="sm" disabled={busy} onClick={run}>{busy ? <Loader2 className="animate-spin"/> : <RefreshCw/>}{busy ? 'Sincronizando…' : active ? 'Reanudar sincronización' : state.hasMore ? 'Continuar sincronización' : 'Sincronizar ahora'}</Button>}
  </div>
  {state && !state.configured && <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground"><p>Vincula el conector oficial de Notion en Lovable y autoriza las páginas que quieras compartir.</p><p>La autorización del conector guarda la conexión de forma segura; no necesitas añadir un token.</p></div>}
  {busy && <div role="status" className="mt-4 space-y-2"><div className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin"/>{progress ? `${progress.processed} de un máximo de 50 páginas · ${progress.newDocuments} nuevos · ${progress.updatedDocuments} actualizados` : 'Buscando páginas compartidas…'}</div><progress className="h-1.5 w-full accent-primary" max={50} value={progress?.processed ?? 0}/></div>}
  {progress?.done && !progress.error && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="size-4 shrink-0"/>{progress.newDocuments} documentos nuevos · {progress.updatedDocuments} actualizados</p>}
  {(state?.hasMore || progress?.hasMore) && <p className="mt-3 text-sm text-muted-foreground">Quedan páginas por revisar. Continúa en la siguiente sincronización.</p>}
  {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  {!!state?.runs.length && <div className="mt-4 border-t border-border pt-3"><h2 className="text-xs font-medium text-muted-foreground">Últimas sincronizaciones</h2><ul className="mt-2 space-y-2">{state.runs.map(r => <li key={r.id} className="flex flex-wrap justify-between gap-2 text-xs"><span>{fmt(r.started_at)}</span><span className={r.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>{r.status === 'completada' ? `${r.new_documents} nuevos · ${r.updated_documents} actualizados` : r.status === 'error' ? r.error_message ?? 'Error' : 'En curso'}</span></li>)}</ul></div>}
 </li>;
}