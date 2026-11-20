import { Link } from '@tanstack/react-router';
import { ArrowRight, Brain, Check, FileText, FolderOpen, Link2, LockKeyhole, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AccessButton({ className = '' }: { className?: string }) {
 return <Button size="lg" asChild className={className}><Link to="/registro">Solicitar acceso<ArrowRight aria-hidden="true"/></Link></Button>;
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
 { Icon: FolderOpen, title: 'Todo en un sitio', text: 'Pregunta sin saber dónde lo guardaste' },
 { Icon: Link2, title: 'Cada dato con su fuente', text: 'Comprueba el origen de cada respuesta' },
 { Icon: TriangleAlert, title: 'Avisa de contradicciones', text: 'Si dos fuentes no coinciden, lo ves' },
];

const steps = [
 { number: '01', title: 'Conecta tus herramientas', text: 'Autoriza Notion en un par de clics' },
 { number: '02', title: 'Pregunta lo que necesites', text: 'En lenguaje natural' },
 { number: '03', title: 'Guarda notas desde el chat', text: 'Con borrador y confirmación' },
];

export function LandingPage() {
 return <div className="landing-page">
  <header className="landing-header landing-container"><div className="landing-brand"><span className="brand-mark"><Brain size={21} aria-hidden="true"/></span>Second Brain</div><nav aria-label="Acceso"><Button variant="ghost" asChild><Link to="/login">Iniciar sesión</Link></Button><AccessButton/></nav></header>
  <main>
   <section className="landing-hero landing-container" aria-labelledby="landing-title">
    <div className="landing-hero-copy"><h1 id="landing-title">Pregunta a tus notas y recibe la respuesta <span>con su fuente</span></h1><p className="landing-subtitle">Second Brain busca en tus notas, documentos y reuniones y cita de dónde sale cada dato.</p><AccessButton className="landing-hero-cta"/><p className="landing-trial">7 días de prueba · Sin tarjeta</p></div>
    <ChatExample/>
   </section>
   <div className="landing-source-band"><div className="landing-source-strip landing-container" aria-label="Fuentes compatibles"><span>Funciona con</span><span><strong>Notion</strong> <span className="landing-available">(Disponible)</span></span><span><strong>Google Drive y Granola</strong> (Próximamente)</span></div></div>
   <section className="landing-benefits landing-container" aria-label="Beneficios"><div className="landing-section-heading"><h2>Lo que sabes, a una pregunta de distancia</h2></div><div className="landing-benefit-grid">{benefits.map(({ Icon, title, text }) => <article className="landing-benefit" key={title}><span className="landing-benefit-icon"><Icon size={20} aria-hidden="true"/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
   <section className="landing-how" aria-labelledby="landing-how-title"><div className="landing-container"><div className="landing-section-heading"><h2 id="landing-how-title">Cómo funciona</h2></div><ol className="landing-steps">{steps.map(({ number, title, text }, index) => <li className="landing-step" key={number}><article className="landing-step-card"><span className="landing-step-number">{number}</span><h3>{title}</h3><p>{text}</p></article>{index < steps.length - 1 && <span className="landing-step-arrow" aria-hidden="true"><ArrowRight size={16}/></span>}</li>)}</ol></div></section>
   <section className="landing-close landing-container"><h2>Empieza a recuperar lo que ya sabes</h2><ul className="landing-trust">{[{ Icon: ShieldCheck, text: 'Solo tú ves tus datos' }, { Icon: LockKeyhole, text: 'Credenciales cifradas' }, { Icon: Check, text: 'Tú eliges qué se indexa' }].map(({ Icon, text }, index) => <li key={text}>{index > 0 && <span className="landing-trust-separator" aria-hidden="true">·</span>}<Icon size={14} aria-hidden="true"/><span>{text}</span></li>)}</ul><AccessButton/><p>El acceso se aprueba manualmente</p></section>
  </main>
  <footer className="landing-footer landing-container"><span>© Second Brain</span><Button variant="link" asChild><Link to="/login">Iniciar sesión</Link></Button></footer>
 </div>;
}