import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Search, Plug, X, ExternalLink, Plus, EyeOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getDocuments, setDocumentExcluded, updateDocumentTags } from '@/services';
import type { Document } from '@/types/second-brain';
import { TypeIcon, formatDate } from './message';

const sources = ['Notion', 'Drive', 'Dropbox', 'Granola', 'Garmin', 'Gmail'] as const;
const types = [['nota', 'Nota'], ['PDF', 'PDF'], ['reunión', 'Reunión'], ['entreno', 'Entreno']] as const;
const ranges = [['all', 'Cualquier fecha'], ['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['older', 'Hace más de 30 días']] as const;
const DAY = 86_400_000;

export function LibraryView() {
 const [docs, setDocs] = useState<Document[] | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [query, setQuery] = useState('');
 const [source, setSource] = useState('all');
 const [type, setType] = useState('all');
 const [range, setRange] = useState('all');
 const [showExcluded, setShowExcluded] = useState(false);
 const [showInaccessible, setShowInaccessible] = useState(false);
 const [selectedId, setSelectedId] = useState<string | null>(null);
 useEffect(() => { getDocuments({ includeExcluded: true, includeInaccessible: true }).then(setDocs).catch((e: Error) => setError(e.message)); }, []);
 const newest = useMemo(() => Math.max(...(docs ?? []).map(d => Date.parse(d.date)), Date.now()), [docs]);
 const visible = useMemo(() => (docs ?? []).filter(d => {
  if (!showExcluded && d.excluded) return false;
  if (!showInaccessible && d.inaccessible) return false;
  if (source !== 'all' && d.source !== source) return false;
  if (type !== 'all' && d.type !== type) return false;
  const age = (newest - Date.parse(d.date)) / DAY;
  if (range === '7' && age > 7) return false;
  if (range === '30' && age > 30) return false;
  if (range === 'older' && age <= 30) return false;
  const q = query.trim().toLocaleLowerCase('es');
  return !q || `${d.title} ${d.summary} ${d.tags.join(' ')}`.toLocaleLowerCase('es').includes(q);
 }), [docs, showExcluded, showInaccessible, source, type, range, query, newest]);
 const excludedCount = (docs ?? []).filter(d => d.excluded).length;
 const inaccessibleCount = (docs ?? []).filter(d => d.inaccessible).length;
 const availableCount = (docs ?? []).filter(d => (showExcluded || !d.excluded) && (showInaccessible || !d.inaccessible)).length;
 const selected = docs?.find(d => d.id === selectedId) ?? null;
 const replace = (doc: Document) => setDocs(prev => prev?.map(d => d.id === doc.id ? doc : d) ?? prev);
 if (docs && docs.length === 0) return <div className="future-page"><div className="empty-symbol"><Plug size={26}/></div><h1>Conecta tu primera fuente</h1><p>Tu biblioteca está vacía. Conecta una fuente para empezar a reunir tus documentos.</p><div className="mt-7"><Button asChild><Link to="/conexiones">Ir a Conexiones</Link></Button></div></div>;
 return <div className={`library ${selected ? 'with-preview' : ''}`}>
  <div className="library-main">
   <div className="library-head"><div><h1>Biblioteca</h1><p>El índice de lo que vive en tus fuentes. Los documentos se añaden al sincronizar tus conexiones.</p></div><span className="library-count">{docs ? `${visible.length} de ${availableCount} documentos` : ''}</span></div>
   <div className="library-filters">
    <label className="library-search"><Search size={15}/><input aria-label="Buscar en la biblioteca" placeholder="Buscar por título, contenido o etiqueta…" value={query} onChange={e => setQuery(e.target.value)}/></label>
    <select aria-label="Fuente" value={source} onChange={e => setSource(e.target.value)}><option value="all">Todas las fuentes</option>{sources.map(s => <option key={s} value={s}>{s}</option>)}</select>
    <select aria-label="Tipo" value={type} onChange={e => setType(e.target.value)}><option value="all">Todos los tipos</option>{types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    <select aria-label="Fecha" value={range} onChange={e => setRange(e.target.value)}>{ranges.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    <label className="library-toggle"><Switch checked={showExcluded} onCheckedChange={setShowExcluded} aria-label="Mostrar excluidos"/>Mostrar excluidos{excludedCount > 0 && <span>{excludedCount}</span>}</label>
    <label className="library-toggle"><Switch checked={showInaccessible} onCheckedChange={setShowInaccessible} aria-label="Mostrar sin acceso"/>Mostrar sin acceso{inaccessibleCount > 0 && <span>{inaccessibleCount}</span>}</label>
   </div>
   {error ? <p className="library-empty">{error}</p> : !docs ? <p className="library-empty">Cargando la biblioteca…</p> : !visible.length ? <p className="library-empty">No hay documentos que coincidan con estos filtros.</p> :
   <div className="library-table" role="table" aria-label="Documentos indexados">
    <div className="library-row library-row-head" role="row"><span role="columnheader">Título</span><span role="columnheader">Fuente</span><span role="columnheader">Tipo</span><span role="columnheader">Modificado en la fuente</span><span role="columnheader">Estado</span></div>
    {visible.map(d => <button key={d.id} type="button" role="row" className="library-row" data-selected={d.id === selectedId} data-excluded={d.excluded} onClick={() => setSelectedId(d.id)}>
     <span role="cell" className="library-title"><TypeIcon type={d.type} className="text-muted-foreground shrink-0"/><span>{d.title}</span>{d.excluded && <span className="excluded-badge"><EyeOff size={11}/>Excluido</span>}</span>
     <span role="cell">{d.source}</span><span role="cell" className="capitalize">{d.type}</span><span role="cell">{formatDate(d.date)}</span>
     <span role="cell"><DocumentStatus doc={d}/></span>
    </button>)}
   </div>}
  </div>
  {selected && <DocumentPanel doc={selected} onClose={() => setSelectedId(null)} onChange={replace}/>}
 </div>;
}

function DocumentStatus({ doc }: { doc: Document }) {
 const pill = <span className="status-pill" data-status={doc.status}>{doc.status}</span>;
 if (!doc.inaccessible) return pill;
 return <TooltipProvider><Tooltip><TooltipTrigger asChild><span tabIndex={0}>{pill}</span></TooltipTrigger><TooltipContent className="max-w-72">Esta página ya no está compartida con la integración. Compártela en Notion para mantenerla actualizada</TooltipContent></Tooltip></TooltipProvider>;
}

export function DocumentPanel({ doc, onClose, onChange }: { doc: Document; onClose: () => void; onChange?: (doc: Document) => void }) {
 const [tag, setTag] = useState('');
 const [saving, setSaving] = useState(false);
 const editable = !!onChange;
 async function run(task: () => Promise<Document>, message?: string) {
  setSaving(true);
  try { const updated = await task(); onChange?.(updated); if (message) toast.success(message); }
  catch (e) { toast.error((e as Error).message); }
  finally { setSaving(false); }
 }
 const addTag = () => { const value = tag.trim(); if (!value) return; setTag(''); run(() => updateDocumentTags(doc.id, [...doc.tags, value])); };
 const excerpt = (doc.content ?? doc.summary).slice(0, 600);
 return <aside className="preview-panel" aria-label="Vista previa del documento">
  <div className="preview-header"><span>Ficha del índice</span><Button variant="ghost" size="icon" aria-label="Cerrar vista previa" onClick={onClose}><X/></Button></div>
  <div className="preview-content">
   <TypeIcon type={doc.type} className="text-primary"/><h2>{doc.title}</h2>
   <div className="preview-metadata"><div><span>Fuente</span>{doc.source}</div><div><span>Tipo</span><span className="capitalize">{doc.type}</span></div><div><span>Modificado en la fuente</span>{formatDate(doc.date)}</div><div><span>Indexado</span>{doc.createdAt ? formatDate(doc.createdAt.slice(0, 10)) : '—'}</div><div><span>Estado</span><DocumentStatus doc={doc}/></div>{doc.updatedAt && <div><span>Última actualización</span>{formatDate(doc.updatedAt.slice(0, 10))}</div>}</div>
   <h3>Resumen</h3><p className="text-muted-foreground">{doc.summary}</p>
   <h3>Etiquetas</h3>
   <div className="tag-list">{doc.tags.map(t => <span key={t} className="tag-chip">{t}{editable && <button type="button" aria-label={`Quitar etiqueta ${t}`} disabled={saving} onClick={() => run(() => updateDocumentTags(doc.id, doc.tags.filter(x => x !== t)))}><X size={11}/></button>}</span>)}{!doc.tags.length && <span className="text-xs text-muted-foreground">Sin etiquetas</span>}</div>
   {editable && <form className="tag-form" onSubmit={e => { e.preventDefault(); addTag(); }}><Input aria-label="Nueva etiqueta" placeholder="Añadir etiqueta" value={tag} onChange={e => setTag(e.target.value)} maxLength={40}/><Button type="submit" variant="outline" size="icon" aria-label="Añadir etiqueta" disabled={saving || !tag.trim()}><Plus/></Button></form>}
   <h3>Extracto del contenido</h3><p className="content-excerpt">{excerpt}{(doc.content?.length ?? 0) > 600 && '…'}</p>
   {doc.externalUrl ? <Button variant="outline" className="w-full mt-8" asChild><a href={doc.externalUrl} target="_blank" rel="noopener noreferrer"><ExternalLink/>Abrir original</a></Button> : <Button variant="outline" className="w-full mt-8" disabled><ExternalLink/>Abrir original</Button>}
   {editable && <div className="exclude-box"><div><strong>Excluir del índice</strong><p>No aparecerá en la biblioteca ni en las respuestas, y la sincronización no lo volverá a indexar.</p></div><Switch checked={!!doc.excluded} disabled={saving} aria-label="Excluir del índice" onCheckedChange={value => run(() => setDocumentExcluded(doc.id, value), value ? 'Documento excluido del índice' : 'Documento reincluido en el índice')}/></div>}
   {editable && doc.excluded && <Button variant="ghost" className="w-full mt-2" disabled={saving} onClick={() => run(() => setDocumentExcluded(doc.id, false), 'Documento reincluido en el índice')}><RotateCcw/>Reincluir en el índice</Button>}
  </div>
 </aside>;
}
