import { useEffect, useState } from 'react';
import { RefreshCw, Plug, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getConnections, setConnected, syncNow } from '@/services';
import type { Connection } from '@/types/second-brain';
import { NotionConnection } from './notion-connection';

const fmt = (iso: string | null) => iso ? new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : 'Nunca';

export function ConnectionsView() {
 const [items, setItems] = useState<Connection[] | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [busy, setBusy] = useState<string | null>(null);
 useEffect(() => { getConnections().then(setItems).catch((e: Error) => setError(e.message)); }, []);
 async function run(id: string, action: () => Promise<Connection>, ok: string) {
  setBusy(id);
  try { const c = await action(); setItems(prev => prev?.map(i => i.id === c.id ? c : i) ?? prev); toast.success(ok); }
  catch (e) { toast.error((e as Error).message); }
  finally { setBusy(null); }
 }
 if (error) return <div className="future-page"><p>{error}</p></div>;
 if (!items) return <div className="future-page"><p>Cargando conexiones…</p></div>;
 return <div className="mx-auto w-full max-w-3xl overflow-y-auto p-6">
  <h1 className="text-2xl font-semibold">Conexiones</h1>
  <p className="mt-1 text-sm text-muted-foreground">Tus fuentes de información, en un solo lugar.</p>
  <ul className="mt-6 grid gap-3">{items.map(c => {
   if (c.source === 'Notion') return <NotionConnection key={c.id} connection={c} onRefresh={async () => setItems(await getConnections())}/>;
   const soon = c.status === 'Próximamente', on = c.status === 'Conectado';
   return <li key={c.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
    <div className="min-w-0 flex-1">
     <div className="flex items-center gap-2 font-medium">{c.name}<span className={`rounded px-1.5 py-0.5 text-[10px] ${on ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{c.status}</span></div>
     <div className="mt-1 text-xs text-muted-foreground">{c.documentCount} documentos · Última sincronización: {fmt(c.lastSync)}</div>
    </div>
    {!soon && <div className="flex gap-2">
     {on && <Button variant="outline" size="sm" disabled={busy === c.id} onClick={() => run(c.id, () => syncNow(c.id), `${c.name} sincronizado`)}><RefreshCw/>Sincronizar ahora</Button>}
     <Button variant={on ? 'ghost' : 'default'} size="sm" disabled={busy === c.id} onClick={() => run(c.id, () => setConnected(c.id, !on), on ? `${c.name} desconectado` : `${c.name} conectado`)}>{on ? <><Unplug/>Desconectar</> : <><Plug/>Conectar</>}</Button>
    </div>}
   </li>; })}</ul>
 </div>;
}
