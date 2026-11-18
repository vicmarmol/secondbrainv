import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Pencil, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { saveToSource, type SaveIntent } from '@/services/source-write';

type Draft = Extract<SaveIntent, { kind: 'draft' }>;
export function SaveDraftCard({ draft, onClose }: { draft: Draft; onClose: () => void }) {
 const save = useServerFn(saveToSource);
 const [title, setTitle] = useState(draft.title);
 const [content, setContent] = useState(draft.content);
 const [source, setSource] = useState(draft.source ?? '');
 const [dest, setDest] = useState(draft.destinationId ?? '');
 const [editing, setEditing] = useState(false);
 const [busy, setBusy] = useState(false);
 const [done, setDone] = useState<string | null>(null);
 const option = draft.options.find(o => o.source === source);
 const ready = !!option && !!dest && title.trim() && content.trim();
 async function confirm() {
  if (!ready || !option) return;
  setBusy(true);
  try { const r = await save({ data: { source: option.source, destinationId: dest, title: title.trim(), content: content.trim() } }); setDone(r.url); toast.success(`Guardado en ${option.name}.`); }
  catch (e) { toast.error((e as Error).message); }
  finally { setBusy(false); }
 }
 if (done) return <section className="save-draft" aria-label="Nota guardada"><p className="text-sm">Guardado en {option?.name}: «{title}». Ya aparece en tu Biblioteca.</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><a href={done} target="_blank" rel="noreferrer"><ExternalLink/>Abrir</a></Button><Button size="sm" variant="ghost" onClick={onClose}>Cerrar</Button></div></section>;
 return <section className="save-draft" aria-label="Borrador para guardar">
  <div className="save-draft-head"><strong>Borrador</strong><span className="text-xs text-muted-foreground">No se guarda nada hasta que pulses Guardar.</span></div>
  <div className="grid gap-2 sm:grid-cols-2">
   <label className="save-field"><span>Fuente</span><select value={source} onChange={e => { setSource(e.target.value); setDest(''); }} disabled={busy}><option value="">Elige una fuente…</option>{draft.options.map(o => <option key={o.source} value={o.source}>{o.name}</option>)}</select></label>
   <label className="save-field"><span>Destino</span><select value={dest} onChange={e => setDest(e.target.value)} disabled={busy || !option}><option value="">{option ? (option.destinations.length ? 'Elige una página padre…' : 'No hay destinos compartidos') : 'Elige antes la fuente'}</option>{option?.destinations.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
  </div>
  {editing ? <><label className="save-field"><span>Título</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={200}/></label><label className="save-field"><span>Contenido</span><textarea rows={5} value={content} onChange={e => setContent(e.target.value)}/></label></>
   : <div className="save-preview"><p className="font-medium">{title}</p><p className="whitespace-pre-wrap text-sm">{content}</p></div>}
  <div className="flex flex-wrap gap-2"><Button size="sm" onClick={confirm} disabled={!ready || busy}><Save/>{busy ? 'Guardando…' : 'Guardar'}</Button><Button size="sm" variant="outline" onClick={() => setEditing(v => !v)} disabled={busy}><Pencil/>{editing ? 'Ver borrador' : 'Editar'}</Button><Button size="sm" variant="ghost" onClick={onClose} disabled={busy}><X/>Descartar</Button></div>
 </section>;
}
