import { createFileRoute } from '@tanstack/react-router';
import { LegalContact, LegalPage, LegalSection } from '@/components/second-brain/legal-page';

export const Route = createFileRoute('/condiciones')({
 head: () => ({ meta: [
  { title: 'Condiciones del Servicio · Second Brain' },
  { name: 'description', content: 'Información sobre el uso de Second Brain, sus fuentes conectadas y el contacto con el titular.' },
  { property: 'og:title', content: 'Condiciones del Servicio · Second Brain' },
  { property: 'og:description', content: 'Uso de tu second brain personal, cuentas, documentos y respuestas con fuentes.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
 ] }),
 component: TermsPage,
});

function TermsPage() {
 return <LegalPage title="Condiciones del Servicio">
  <LegalSection title="1. El servicio">
   <p>Second Brain es un asistente de conocimiento personal. Permite reunir documentos y notas, conectar fuentes autorizadas y hacer preguntas para obtener respuestas con referencias a esos contenidos.</p>
  </LegalSection>
  <LegalSection title="2. Tu cuenta">
   <p>Puedes acceder con Google o con correo electrónico y contraseña. La cuenta es tu espacio personal: cuida tus credenciales y los permisos que concedas a las fuentes conectadas.</p>
  </LegalSection>
  <LegalSection title="3. Tus documentos y fuentes">
   <p>La app guarda tus documentos y notas en su backend para poder buscarlos y utilizarlos en las respuestas. Conecta únicamente fuentes y contenidos que estés autorizado a utilizar. Fuentes como Notion solo se conectan con tu autorización y su disponibilidad depende de los permisos concedidos.</p>
  </LegalSection>
  <LegalSection title="4. Respuestas y referencias">
   <p>Las respuestas se generan con inteligencia artificial a partir del contenido disponible y pueden contener errores o no encontrar toda la información. Revisa las fuentes citadas antes de tomar decisiones importantes.</p>
  </LegalSection>
  <LegalSection title="5. Datos y contacto">
   <p>No vendemos tus datos a terceros. Puedes consultar cómo se utilizan en la Política de Privacidad, enlazada al pie de esta página.</p>
   <p>Para consultar sobre el servicio o solicitar que se borren tu cuenta y sus datos, escribe a <LegalContact/>.</p>
  </LegalSection>
 </LegalPage>;
}