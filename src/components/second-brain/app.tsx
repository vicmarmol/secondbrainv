import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Brain, Plus, MessageSquare, Library, Plug, Sun, Moon, ChevronDown, ChevronRight, ArrowUp, ArrowUpRight, Sparkles, BookOpen, AudioLines, Bike, Users, Menu, X, ExternalLink, FileText, HardDrive, Triangle, Leaf, Settings2, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getConversations, sendMessage } from '@/services';
import type { Conversation, Message, Citation } from '@/types/second-brain';
import { AssistantMessage, TypeIcon, formatDate } from './message';
const suggestions = [
 { label: '¿Qué es un MVP?', category: 'CONECTA IDEAS', icon: BookOpen },
 { label: '¿Qué acordamos en la última reunión de producto?', category: 'RECUPERA DECISIONES', icon: AudioLines },
 { label: '¿Con quién hablé sobre pricing?', category: 'ENCUENTRA CONTEXTO', icon: Users },
 { label: 'Compara mis salidas en bici de este mes con el anterior', category: 'DESCUBRE PATRONES', icon: Bike },
];
export function SecondBrainApp({ view = 'chat' }: { view?: 'chat' | 'library' | 'connections' }) {
 const [dark, setDark] = useState(false);
 const [mobile, setMobile] = useState(false);
 const [conversations, setConversations] = useState<Conversation[]>([]);
 const [loading, setLoading] = useState(true);
 const [active, setActive] = useState<string | null>(null);
 const [input, setInput] = useState('');
 const [pending, setPending] = useState<string | null>(null);
 const [animatedIds, setAnimatedIds] = useState<string[]>([]);
 const [citation, setCitation] = useState<Citation | null>(null);
 const bodyRef = useRef<HTMLDivElement>(null);
 const textareaRef = useRef<HTMLTextAreaElement>(null);
 const messages = conversations.find(c => c.id === active)?.messages ?? [];
 useEffect(() => { let alive = true; getConversations().then(data => { if (alive) { setConversations(data); setLoading(false); } }); return () => { alive = false; }; }, []);
 useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
 useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages.length, pending]);
 function newChat() { setActive(null); setCitation(null); setInput(''); setMobile(false); textareaRef.current?.focus(); }
 async function send(text: string) {
  if (!text.trim() || pending) return;
  const id = active ?? `conversation-${crypto.randomUUID()}`;
  const user: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim(), citations: [] };
  setConversations(prev => active ? prev.map(c => c.id === id ? { ...c, messages: [...c.messages, user] } : c) : [{ id, title: text.trim(), group: 'Hoy', messages: [user] }, ...prev]);
  setActive(id); setInput(''); setPending(id); setCitation(null);
  try { const answer = await sendMessage(text); setAnimatedIds(prev => [...prev, answer.id]); setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: [...c.messages, answer] } : c)); }
  finally { setPending(null); }
 }
 const title = view === 'chat' ? 'Chat' : view === 'library' ? 'Biblioteca' : 'Conexiones';
 return <div className="app-shell">
 {mobile && <div className="mobile-overlay" onClick={() => setMobile(false)}/>}
 <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
  <div className="brand"><span className="brand-mark"><Brain size={21}/></span>Second Brain</div>
  <Button variant="ghost" className="new-chat" onClick={newChat} asChild={view !== 'chat'}>{view === 'chat' ? <><Plus/>Nueva conversación</> : <Link to="/"><Plus/>Nueva conversación</Link>}</Button>
  <nav aria-label="Navegación principal"><Button variant="ghost" className="nav-item" data-active={view === 'chat'} asChild><Link to="/" onClick={() => setMobile(false)}><MessageSquare/>Chat{view === 'chat' && <span className="nav-tail"/>}</Link></Button><Button variant="ghost" className="nav-item" data-active={view === 'library'} asChild><Link to="/biblioteca" onClick={() => setMobile(false)}><Library/>Biblioteca</Link></Button><Button variant="ghost" className="nav-item" data-active={view === 'connections'} asChild><Link to="/conexiones" onClick={() => setMobile(false)}><Plug/>Conexiones</Link></Button></nav>
  <div className="history"><div className="history-label">Conversaciones recientes</div>{loading ? <p className="px-3 text-xs text-muted-foreground">Cargando conversaciones…</p> : (['Hoy','Ayer','Anteriores'] as const).map(group => <div key={group}><div className="history-group">{group}</div>{conversations.filter(c => c.group === group).map(c => <Button key={c.id} variant="ghost" className="history-item" aria-pressed={active === c.id} onClick={() => { setActive(c.id); setCitation(null); setMobile(false); }} asChild={view !== 'chat'}>{view !== 'chat' ? <Link to="/"><MessageSquare size={13}/><span>{c.title}</span></Link> : <><MessageSquare size={13}/><span>{c.title}</span></>}</Button>)}</div>)}</div>
  <div className="sidebar-bottom"><div className="theme-picker" aria-label="Apariencia"><Button variant="ghost" aria-pressed={!dark} onClick={() => setDark(false)}><Sun/>Claro</Button><Button variant="ghost" aria-pressed={dark} onClick={() => setDark(true)}><Moon/>Oscuro</Button></div><div className="profile"><div className="avatar">AL</div><div className="flex-1"><div className="text-xs font-medium">Álex López</div><div className="text-[10px] text-muted-foreground mt-1">Espacio personal</div></div><span className="text-[9px] text-muted-foreground border border-border rounded px-1.5 py-0.5">DEMO</span></div></div>
 </aside>
 <main className={`workspace ${citation ? 'preview-open' : ''}`}><header className="topbar"><div className="breadcrumb"><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Abrir menú" onClick={() => setMobile(!mobile)}>{mobile ? <X/> : <Menu/>}</Button><span>Mi espacio</span><ChevronRight size={12}/><span className="text-foreground font-medium">{title}</span></div><div className="top-status"><span className="status-dot"/><span>Todo al día</span><span className="mx-2 text-border">|</span><span>Modo de ejemplo</span><CircleHelp size={14}/></div></header>
 {view !== 'chat' ? <div className="future-page"><div className="empty-symbol">{view === 'library' ? <Library size={26}/> : <Plug size={26}/>}</div><h1>{title}</h1><p>{view === 'library' ? 'Tus notas, documentos y reuniones tendrán aquí su lugar.' : 'Tus fuentes de información, en un solo lugar.'}</p><span className="text-xs text-muted-foreground">Disponible en la siguiente etapa del prototipo</span><div className="mt-7"><Button variant="outline" asChild><Link to="/">Volver al chat</Link></Button></div></div> : <>
 <div className="chat-body" ref={bodyRef}>
 {!messages.length ? <section className="empty-chat"><div className="empty-symbol"><Brain size={30} strokeWidth={1.5}/></div><h1>¿Qué necesitas recordar?</h1><p className="intro">Tus ideas, reuniones y conocimientos. Todo conectado.<br/>Pregunta algo y encuentra la respuesta en tus fuentes.</p><div className="suggestions">{suggestions.map(s => <Button key={s.label} variant="ghost" className="suggestion" disabled={!!pending} onClick={() => send(s.label)}><span className="suggestion-top"><s.icon size={15}/>{s.category}<ArrowUpRight/></span><span>{s.label}</span></Button>)}</div><div className="source-row"><span>Tu conocimiento, conectado con</span><div className="source-logos" aria-label="Notion, Drive, Dropbox, Granola y Garmin"><span className="source-logo notion" title="Notion">N</span><span className="source-logo" title="Google Drive"><Triangle size={20}/></span><span className="source-logo" title="Dropbox"><HardDrive size={19}/></span><span className="source-logo" title="Granola"><Leaf size={20}/></span><span className="source-logo" title="Garmin"><Bike size={20}/></span></div></div></section> : <div className="messages">{messages.map(m => m.role === 'user' ? <div key={m.id} className="user-message">{m.content}</div> : <AssistantMessage key={m.id} message={m} animate={animatedIds.includes(m.id)} onCitation={setCitation} onFeedback={value => setConversations(prev => prev.map(c => c.id === active ? { ...c, messages: c.messages.map(item => item.id === m.id ? { ...item, feedback: item.feedback === value ? undefined : value } : item) } : c))}/>)}{pending === active && <div className="assistant-message" role="status"><div className="assistant-heading"><Brain size={19} className="text-primary"/>Buscando en tus fuentes…</div><div className="loading-dots"><span/><span/><span/></div></div>}</div>}
 </div>
 <div className="composer-wrap"><form className="composer" onSubmit={event => { event.preventDefault(); send(input); }}><textarea ref={textareaRef} aria-label="Pregunta a Second Brain" placeholder="Pregunta a tu Second Brain…" value={input} rows={2} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}/><div className="composer-tools"><div className="composer-sources"><Settings2/><span>Todas las fuentes</span><ChevronDown size={12}/></div><Button size="icon" type="submit" disabled={!input.trim() || !!pending} aria-label="Enviar mensaje" title="Enviar mensaje"><ArrowUp/></Button></div></form><p className="composer-note">Las respuestas se basan en tus fuentes. Revisa las citas para comprobar la información.</p></div>
 </>}
 {citation && <aside className="preview-panel" aria-label="Vista previa del documento"><div className="preview-header"><span className="flex items-center gap-2"><FileText size={15}/>Fuente original</span><Button variant="ghost" size="icon" aria-label="Cerrar vista previa" onClick={() => setCitation(null)}><X/></Button></div><div className="preview-content"><TypeIcon type={citation.document.type} className="text-primary"/><h2>{citation.document.title}</h2><div className="preview-metadata"><div><span>Fuente</span>{citation.document.source}</div><div><span>Modificado</span>{formatDate(citation.document.date)}</div><div><span>Tipo</span>{citation.document.type}</div><div><span>Estado</span>{citation.document.status}</div></div><h3>Fragmento relevante</h3><p>{citation.document.chunks.map(chunk => <span key={chunk.id}>{chunk.id === citation.chunkId ? <mark>{chunk.text}</mark> : chunk.text}</span>)}</p><h3>Resumen</h3><p className="text-muted-foreground">{citation.document.summary}</p><div className="flex flex-wrap gap-2 mt-5">{citation.document.tags.map(tag => <span key={tag} className="bg-muted text-muted-foreground text-[10px] px-2 py-1 rounded">{tag}</span>)}</div><Button variant="outline" className="w-full mt-8" title="Solo disponible al conectar datos reales" aria-disabled="true"><ExternalLink/>Abrir original</Button><p className="text-muted-foreground text-center">Documento de ejemplo</p></div></aside>}
 </main></div>;
}
