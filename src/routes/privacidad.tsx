import { createFileRoute } from '@tanstack/react-router';
import { LegalContact, LegalPage, LegalSection } from '@/components/second-brain/legal-page';

export const Route = createFileRoute('/privacidad')({
 head: () => ({ meta: [
  { title: 'Política de Privacidad · Second Brain' },
  { name: 'description', content: 'Cómo Second Brain utiliza tus datos, conecta tus fuentes y atiende solicitudes de borrado.' },
  { property: 'og:title', content: 'Política de Privacidad · Second Brain' },
  { property: 'og:description', content: 'Información sobre tus datos personales y el contacto para solicitar su borrado en Second Brain.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
 ] }),
 component: PrivacyPage,
});

function PrivacyPage() {
 return <LegalPage title="Política de Privacidad">
  <LegalSection title="1. Qué es Second Brain">
   <p>Second Brain es un second brain personal: reúne tus notas y documentos y te permite hacer preguntas sobre ellos, con respuestas que citan sus fuentes. Para cualquier consulta sobre tus datos, puedes escribir al titular en <LegalContact/>.</p>
  </LegalSection>
  <LegalSection title="2. Tu cuenta y tu contenido">
   <p>Puedes iniciar sesión con Google o con correo electrónico y contraseña. Al usar Google recibimos tu correo y perfil básico, como tu nombre y foto; Google gestiona la identificación. Si utilizas correo y contraseña, el servicio de autenticación de Lovable Cloud gestiona esas credenciales.</p>
   <p>Los documentos, notas, conversaciones y datos de tu cuenta se guardan en el backend de la app, en Lovable Cloud, para ofrecerte tu espacio personal y responder a tus preguntas.</p>
  </LegalSection>
  <LegalSection title="3. Fuentes conectadas y respuestas con IA">
   <p>Solo conectamos fuentes como Notion cuando tú lo autorizas. Se utilizan los permisos de esa conexión para importar y sincronizar el contenido autorizado; si decides guardar una nota en la fuente, también se utiliza esa conexión. La app conserva la información necesaria para mantenerla y sincronizarla.</p>
   <p>Para generar respuestas, se envían tu pregunta, el contexto reciente de la conversación y el contenido relevante de tus documentos a Lovable AI, que utiliza un modelo de OpenAI. Esto permite elaborar respuestas basadas en tus fuentes.</p>
   <p>No vendemos tus datos a terceros. Los servicios mencionados reciben los datos necesarios para las funciones que prestan; esto no equivale a una venta de tus datos.</p>
  </LegalSection>
  <LegalSection title="4. Pagos y otros servicios">
   <p>Si contratas una suscripción, Stripe recibe la información necesaria para gestionar el pago y la suscripción. La app guarda referencias del cliente, la suscripción y su estado.</p>
   <p>La tipografía de estas páginas se carga desde Google Fonts: tu navegador solicita los archivos a Google y le comunica los datos técnicos de esa solicitud, como la dirección IP y el navegador.</p>
  </LegalSection>
  <LegalSection title="5. Información guardada en tu navegador">
   <p>El inicio de sesión utiliza almacenamiento local del navegador para conservar la sesión. Si introduces un código de invitación durante el registro, se guarda temporalmente en ese almacenamiento, con una caducidad de una hora, y se elimina al consumirlo.</p>
  </LegalSection>
  <LegalSection title="6. Analítica de visitas">
   <p>En el sitio publicado, Lovable registra las páginas visitadas, de dónde llegan las visitas, el país, el navegador, el sistema operativo y el tipo de dispositivo, el tiempo de permanencia, la velocidad de carga, los errores y los clics en botones y enlaces.</p>
   <p>Actualmente no hay un aviso que solicite una elección de analítica: estos datos se registran para todos los visitantes. La analítica de Lovable no utiliza cookies, no guarda nada en el dispositivo del visitante, no conserva direcciones IP y no identifica a los visitantes.</p>
   <p>Los datos detallados se conservan durante 90 días y los resúmenes diarios durante un año.</p>
   <p>Lovable recoge estos datos para nosotros. Su <a href="https://lovable.dev/privacy" className="text-primary underline underline-offset-4">política de privacidad</a> explica cómo los trata.</p>
  </LegalSection>
  <LegalSection title="7. Solicitar el borrado de tus datos">
   <p>Puedes solicitar el borrado de tu cuenta y sus datos escribiendo a <LegalContact/> desde el correo asociado a tu cuenta. El borrado de los datos de la app no implica borrar tus documentos originales de Notion u otras fuentes.</p>
  </LegalSection>
 </LegalPage>;
}