import { useEffect, useState } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowRight, Brain, Database, Leaf, Loader2, LogOut, Plug, Triangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadSampleData, signOut } from '@/services';
import { startNotionConnect, completeNotionConnect } from '@/services/notion';
import { connectWelcomeNotion, getWelcomeCounts } from '@/services/welcome';
import { needsWelcome } from '@/lib/welcome';
import { setViewAs, useViewAs, viewAsLabel } from '@/lib/view-as';
import { getBilling } from '@/services/billing';

export function WelcomePage() {
 const navigate = useNavigate();
 const router = useRouter();
 const queryClient = useQueryClient();
 const billing = useQuery({ queryKey: ['billing'], queryFn: getBilling });
 const rawViewAs = useViewAs();
 const viewAs = billing.data?.freeAccess ? rawViewAs : null;
 useEffect(() => { if (viewAs?.kind === 'expired') void navigate({ to: '/suscripcion', replace: true }); }, [viewAs, navigate]);
 const start = useServerFn(startNotionConnect);
 const complete = useServerFn(completeNotionConnect);
 const [busy, setBusy] = useState<'notion' | 'samples' | 'logout' | null>(null);
 const [notionError, setNotionError] = useState(false);
 const [sampleError, setSampleError] = useState(false);
 async function enterChat() {
  if (needsWelcome(await getWelcomeCounts())) throw new Error('Todavía no hay ninguna fuente.');
  await queryClient.invalidateQueries();
  await router.invalidate();
  await navigate({ to: '/chat', replace: true });
 }
 async function connect() {
  setBusy('notion'); setNotionError(false);
  try { await connectWelcomeNotion(start, complete); await queryClient.invalidateQueries(); await navigate({ to: '/bienvenida/indexando', replace: true }); }
  catch { setNotionError(true); }
  finally { setBusy(null); }
 }
 async function samples() {
  setBusy('samples'); setSampleError(false);
  try { await loadSampleData(); await enterChat(); }
  catch { setSampleError(true); }
  finally { setBusy(null); }
 }
 async function logout() {
  setBusy('logout'); setViewAs(null);
  try { await queryClient.cancelQueries(); queryClient.clear(); await signOut(); await navigate({ to: '/auth', replace: true }); }
  finally { setBusy(null); }
 }
 return <main className="welcome-page">
  <div className="welcome-content">
   {viewAs && <div className="view-as-banner mb-6" role="status"><span>Estás viendo la app como: <strong>{viewAsLabel(viewAs)}</strong></span><Button size="sm" variant="outline" onClick={() => setViewAs(null)}>Salir de la vista previa</Button></div>}
   <div className="welcome-brand"><span className="brand-mark"><Brain size={21} aria-hidden="true"/></span>Second Brain</div>
   <ol className="welcome-steps" aria-label="Primeros pasos"><li aria-current="step"><span>1</span>Conecta</li><li aria-hidden="true"><ArrowRight size={14}/></li><li><span>2</span>Pregunta</li></ol>
   <header className="welcome-heading"><h1>Conecta tu primera herramienta</h1><p>Second Brain responde con lo que hay en tus fuentes. Conecta una para empezar.</p></header>
   <div className="welcome-sources">
    <article className="welcome-source welcome-notion"><div className="welcome-source-icon welcome-notion-icon" aria-hidden="true">N</div><h2>Notion</h2><p>Tus notas y páginas</p><Button className="welcome-connect" onClick={connect} disabled={busy !== null}>{busy === 'notion' ? <Loader2 className="animate-spin" aria-hidden="true"/> : <Plug aria-hidden="true"/>}{busy === 'notion' ? 'Conectando…' : 'Conectar Notion'}</Button><p className="welcome-source-help">En Notion, elige las páginas que quieres compartir. Solo se indexan esas.</p>{notionError && <p role="alert" className="welcome-error">No se pudo conectar. Inténtalo de nuevo</p>}</article>
    <article className="welcome-source welcome-soon"><div className="welcome-source-icon" aria-hidden="true"><Triangle size={26}/></div><h2>Google Drive</h2><p>Tus documentos y archivos</p><span className="welcome-soon-label">Próximamente</span></article>
    <article className="welcome-source welcome-soon"><div className="welcome-source-icon" aria-hidden="true"><Leaf size={26}/></div><h2>Granola</h2><p>Tus notas de reuniones</p><span className="welcome-soon-label">Próximamente</span></article>
   </div>
   <div className="welcome-sample"><Button variant="link" onClick={samples} disabled={busy !== null}>{busy === 'samples' ? <Loader2 className="animate-spin" aria-hidden="true"/> : <Database aria-hidden="true"/>}{busy === 'samples' ? 'Cargando datos de ejemplo…' : '¿Prefieres verlo antes? Probar con datos de ejemplo'}</Button>{sampleError && <p role="alert" className="welcome-error">No se pudieron cargar los ejemplos. Inténtalo de nuevo</p>}</div>
   <footer className="welcome-footer"><Button variant="ghost" size="sm" onClick={logout} disabled={busy !== null}>{busy === 'logout' ? <Loader2 className="animate-spin" aria-hidden="true"/> : <LogOut aria-hidden="true"/>}Cerrar sesión</Button></footer>
  </div>
 </main>;
}