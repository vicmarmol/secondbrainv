import { Link } from '@tanstack/react-router';
import { ArrowRight, Brain, Check, FilePlus2, FileText, FolderOpen, Link2, LockKeyhole, Mic, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AccessButton({ className = '' }: { className?: string }) {
 return <Button size="lg" asChild className={className}><Link to="/login">Solicitar acceso<ArrowRight aria-hidden="true"/></Link></Button>;
}

function ChatExample() {
 return <div className="landing-chat" role="img" aria-label="Ejemplo de una conversación con respuestas citadas y aviso de fuentes en desacuerdo">
  <div className="landing-chat-top"><span className="landing-chat-brand"><Brain size={17} aria-hidden="true"/>Second Brain</span><span className="landing-example-label">Ejemplo de conversación</span></div>
  <div className="landing-chat-content">
   <div className="landing-user-question">¿Qué acordamos sobre el precio en la última reunión?</div>
   <div className="landing-assistant-label"><span className="landing-mini-mark"><Brain size={14} aria-hidden="true"/></span>Second Brain</div>
   <p className="landing-answer">En la última reunión se acordó <strong>mantener el precio actual</strong> hasta revisar la propuesta con el equipo. <span className="landing-reference">1</span> La decisión final queda pendiente de la próxima reunión. <span className="landing-reference">2</span></p>
   <div className="landing-citations"><span><FileText size={13} aria-hidden="true"/><b>1</b> Notion · Reunión de producto</span><span><FileText size={13} aria-hidden="true"/><b>2</b> Notion · Notas del equipo</span></div>
   <div className="landing-conflict"><div className="landing-conflict-title"><TriangleAlert size={16} aria-hidden="true"/>Fuentes en desacuerdo</div><div className="landing-conflict-sources"><div><span>Notion · Reunión de producto</span><p>«Mantener el precio actual.»</p></div><div><span>Notion · Propuesta comercial</span><p>«Actualizar el precio al lanzar.»</p></div></div></div>
  </div>
  <div className="landing-chat-bottom"><span>Pregunta a tus notas…</span><span className="landing-send"><ArrowRight size={16} aria-hidden="true"/></span></div>
 </div>;
}

const benefits = [
 { Icon: FolderOpen, title: 'Todo en un sitio', text: 'Conecta tus fuentes y pregunta en lenguaje natural.' },
 { Icon: Link2, title: 'Cada dato con su fuente', text: 'Las respuestas citan el documento de origen para que puedas comprobarlas.' },
 { Icon: TriangleAlert, title: 'Te avisa de contradicciones', text: 'Si dos fuentes dicen cosas distintas, te lo muestra.' },
];

const steps = [
 { number: '01', Icon: Link2, title: 'Conecta tus herramientas', text: 'Autoriza Notion en un par de clics. Tus documentos se indexan solos y se mantienen al día cada hora.' },
 { number: '02', Icon: Search, title: 'Pregunta lo que necesites', text: 'Escribe en lenguaje natural: qué se decidió, dónde aparece un dato, con quién hablaste de un tema.' },
 { number: '03', Icon: FilePlus2, title: 'Guarda notas desde el chat', text: 'Escribe «guarda en Notion: …», revisa el borrador y confírmalo. La nota nace en tu herramienta, no en la nuestra.' },
];

export function LandingPage() {
 return <div className="landing-page">
  <header className="landing-header landing-container"><div className="landing-brand"><span className="brand-mark"><Brain size={21} aria-hidden="true"/></span>Second Brain</div><nav aria-label="Acceso"><Button variant="ghost" asChild><Link to="/login">Iniciar sesión</Link></Button><AccessButton/></nav></header>
  <main>
   <section className="landing-hero landing-container" aria-labelledby="landing-title">
    <div className="landing-hero-copy"><span className="landing-eyebrow"><span/>Tu conocimiento, conectado</span><h1 id="landing-title">Pregunta a tus notas.<br/><span>Recibe la respuesta con su fuente.</span></h1><p className="landing-subtitle">Second Brain busca en tus notas, documentos y reuniones y te responde citando de dónde sale cada dato. Sin abrir cinco herramientas.</p><AccessButton className="landing-hero-cta"/><p className="landing-trial">7 días de prueba. Sin tarjeta.</p></div>
    <ChatExample/>
   </section>
   <section className="landing-problem"><div className="landing-container"><p>Tu información está repartida entre notas, documentos y reuniones.<br className="landing-desktop-break"/> <strong>Cuando la necesitas, no sabes dónde está.</strong></p></div></section>
   <section className="landing-benefits landing-container" aria-label="Beneficios"><div className="landing-section-heading"><span className="landing-eyebrow">Menos buscar. Más encontrar.</span><h2>Lo que sabes, a una pregunta de distancia.</h2></div><div className="landing-benefit-grid">{benefits.map(({ Icon, title, text }) => <article className="landing-benefit" key={title}><span className="landing-benefit-icon"><Icon size={22} aria-hidden="true"/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
   <section className="landing-how" aria-labelledby="landing-how-title"><div className="landing-container"><div className="landing-section-heading"><h2 id="landing-how-title">Cómo funciona</h2></div><ol className="landing-steps">{steps.map(({ number, Icon, title, text }, index) => <li className="landing-step" key={number}><article className="landing-step-card"><div className="landing-step-top"><span className="landing-step-number">{number}</span><span className="landing-step-icon"><Icon size={17} aria-hidden="true"/></span></div><h3>{title}</h3><p>{text}</p></article>{index < steps.length - 1 && <span className="landing-step-arrow" aria-hidden="true"><ArrowRight size={16}/></span>}</li>)}</ol></div></section>
   <section className="landing-sources landing-container" aria-labelledby="landing-sources-title"><div><span className="landing-eyebrow">Tus herramientas, conectadas</span><h2 id="landing-sources-title">Empieza con tus notas en Notion.</h2></div><div className="landing-source-list"><div><FileText aria-hidden="true"/><span>Notion</span><span className="landing-available"><span/>Disponible</span></div><div><FolderOpen aria-hidden="true"/><span>Google Drive</span><span className="landing-soon">Próximamente</span></div><div><Mic aria-hidden="true"/><span>Granola</span><span className="landing-soon">Próximamente</span></div></div></section>
   <section className="landing-privacy"><div className="landing-container"><div className="landing-section-heading"><ShieldCheck size={28} className="text-primary" aria-hidden="true"/><h2>Tu conocimiento sigue siendo tuyo.</h2></div><ul>{[{ Icon: LockKeyhole, text: 'Cada usuario solo ve sus propios datos' }, { Icon: ShieldCheck, text: 'Las credenciales de tus herramientas se guardan cifradas' }, { Icon: Check, text: 'Tú eliges qué se indexa y qué no' }].map(({ Icon, text }) => <li key={text}><Icon size={18} aria-hidden="true"/><span>{text}</span></li>)}</ul></div></section>
   <section className="landing-close landing-container"><span className="landing-close-mark"><Brain size={27} aria-hidden="true"/></span><h2>Empieza a recuperar<br/>lo que ya sabes</h2><AccessButton/><p>El acceso se aprueba manualmente.<br/>Te daremos paso en cuanto lo revisemos.</p></section>
  </main>
  <footer className="landing-footer landing-container"><span>© Second Brain</span><Button variant="link" asChild><Link to="/login">Iniciar sesión</Link></Button></footer>
 </div>;
}