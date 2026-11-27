import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowRight, Brain, Check, CheckCircle2, Database, KeyRound, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadSampleData, signOut } from '@/services';
import { beginNotionSync, stepNotionSync, syncNotion, startNotionConnect, completeNotionConnect } from '@/services/notion';
import { connectWelcomeNotion } from '@/services/welcome';
import { getIndexedDocuments } from '@/services/indexing';
import { skipIndexingForSession } from '@/lib/onboarding';
import { setViewAs } from '@/lib/view-as';

type Phase = 'indexing' | 'done' | 'error';
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function IndexingPage() {
 const navigate = useNavigate();
 const router = useRouter();
 const queryClient = useQueryClient();
 const begin = useServerFn(beginNotionSync);
 const step = useServerFn(stepNotionSync);
 const start = useServerFn(startNotionConnect);
 const complete = useServerFn(completeNotionConnect);
 const [phase, setPhase] = useState<Phase>('indexing');
 const [slow, setSlow] = useState(false);
 const [busy, setBusy] = useState<'reauth' | 'samples' | 'logout' | null>(null);
 const [actionError, setActionError] = useState<string | null>(null);
 const running = useRef(false);
 const counts = useQuery({ queryKey: ['indexing-documents'], queryFn: getIndexedDocuments, refetchInterval: phase === 'indexing' ? 2500 : false });

 const run = useCallback(async () => {
  if (running.current) return;
  running.current = true; setPhase('indexing'); setSlow(false);
  try { await syncNotion(begin, step, () => undefined); await counts.refetch(); setPhase('done'); }
  catch { setPhase('error'); }
  finally { running.current = false; }
 }, [begin, step, counts]);
 useEffect(() => { void run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(() => { if (phase !== 'indexing') return; const t = window.setTimeout(() => setSlow(true), 60_000); return () => window.clearTimeout(t); }, [phase]);

 async function goChat() { await queryClient.invalidateQueries(); await router.invalidate(); await navigate({ to: '/chat', replace: true }); }
 async function leaveEarly() { skipIndexingForSession(); await goChat(); }
 async function reauthorize() {
  setBusy('reauth'); setActionError(null);
  try { await connectWelcomeNotion(start, complete, 'reauthorize'); setBusy(null); await run(); }
  catch { setActionError('No se ha completado la autorización. Se mantiene el permiso actual.'); }
  finally { setBusy(null); }
 }
 async function samples() {
  setBusy('samples'); setActionError(null);
  try { await loadSampleData(); await goChat(); }
  catch { setActionError('No se pudieron cargar los ejemplos. Inténtalo de nuevo'); }
  finally { setBusy(null); }
 }
 async function logout() {
  setBusy('logout'); setViewAs(null);
  try { await queryClient.cancelQueries(); queryClient.clear(); await signOut(); await navigate({ to: '/auth', replace: true }); }
  finally { setBusy(null); }
 }

 const indexed = counts.data?.indexed ?? 0;
 const blocked = counts.data?.inaccessible ?? 0;
 return <main className="welcome-page">
  <div className="welcome-content indexing-content">
   <div className="welcome-brand"><span className="brand-mark"><Brain size={21} aria-hidden="true"/></span>Second Brain</div>
   <ol className="welcome-steps" aria-label="Primeros pasos"><li className="welcome-step-done"><span><Check size={13} aria-hidden="true"/></span>Conecta</li><li aria-hidden="true"><ArrowRight size={14}/></li><li aria-current="step"><span>2</span>Pregunta</li></ol>
   {phase === 'indexing' && <section className="indexing-card" aria-live="polite">
    <header className="welcome-heading"><h1>Estamos leyendo tus documentos</h1><p>Esto suele tardar menos de un minuto.</p></header>
    <div className="indexing-bar" role="progressbar" aria-label="Indexando documentos"><span/></div>
    <p className="indexing-count">{plural(indexed, 'documento indexado', 'documentos indexados')}</p>
    {slow && <Button variant="link" className="indexing-link" onClick={leaveEarly}>Ir al chat mientras termina</Button>}
   </section>}
   {phase === 'done' && indexed > 0 && <section className="indexing-card">
    <CheckCircle2 className="indexing-icon" aria-hidden="true"/>
    <header className="welcome-heading"><h1>Listo: {plural(indexed, 'documento indexado', 'documentos indexados')}</h1><p>Ya puedes preguntarle a tu Second Brain.</p></header>
    <Button size="lg" onClick={goChat}>Empezar a preguntar<ArrowRight aria-hidden="true"/></Button>
    {blocked > 0 && <p className="indexing-note">{plural(blocked, 'página no se ha podido leer porque no está compartida', 'páginas no se han podido leer porque no están compartidas')} con la integración en Notion.</p>}
   </section>}
   {phase === 'done' && indexed === 0 && <section className="indexing-card">
    <header className="welcome-heading"><h1>No hemos encontrado documentos</h1><p>Normalmente ocurre porque no has compartido ninguna página en Notion. Vuelve a autorizar y elige las páginas que quieres indexar.</p></header>
    <Button size="lg" onClick={reauthorize} disabled={busy !== null}>{busy === 'reauth' ? <Loader2 className="animate-spin" aria-hidden="true"/> : <KeyRound aria-hidden="true"/>}Volver a autorizar</Button>
    <div className="welcome-sample"><Button variant="link" onClick={samples} disabled={busy !== null}>{busy === 'samples' ? <Loader2 className="animate-spin" aria-hidden="true"/> : <Database aria-hidden="true"/>}Probar con datos de ejemplo</Button></div>
    {actionError && <p role="alert" className="welcome-error">{actionError}</p>}
   </section>}
   {phase === 'error' && <section className="indexing-card">
    <header className="welcome-heading"><h1>No se ha podido completar la sincronización</h1><p>Inténtalo de nuevo. Si sigue fallando, revisa la conexión en la página de Conexiones.</p></header>
    <Button size="lg" onClick={() => void run()}><RefreshCw aria-hidden="true"/>Reintentar</Button>
   </section>}
   <footer className="welcome-footer"><Button variant="ghost" size="sm" onClick={logout} disabled={busy !== null}>{busy === 'logout' ? <Loader2 className="animate-spin" aria-hidden="true"/> : <LogOut aria-hidden="true"/>}Cerrar sesión</Button></footer>
  </div>
 </main>;
}
