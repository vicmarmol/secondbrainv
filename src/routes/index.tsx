import { createFileRoute, redirect } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';
import { LandingPage } from '@/components/second-brain/landing';
import { supabase } from '@/integrations/supabase/client';
import { homeDestination } from '@/lib/home-navigation';

const redirectSignedIn = createIsomorphicFn()
 .server(() => undefined)
 .client(async () => {
  const { data } = await supabase.auth.getSession();
  const destination = homeDestination(Boolean(data.session));
  if (destination) throw redirect({ to: destination, replace: true });
 });

export const Route = createFileRoute('/')({
 beforeLoad: () => redirectSignedIn(),
 head: () => ({
  meta: [
   { title: 'Second Brain · Pregunta a tus notas' },
   { name: 'description', content: 'Second Brain busca en tus notas, documentos y reuniones y responde citando sus fuentes. Solicita acceso: 7 días de prueba, sin tarjeta.' },
   { property: 'og:title', content: 'Second Brain · Pregunta a tus notas' },
   { property: 'og:description', content: 'Recupera lo que ya sabes con respuestas que citan tus fuentes. Tu conocimiento, conectado y privado.' },
   { property: 'og:type', content: 'website' },
   { property: 'og:url', content: 'https://secondbrainv.lovable.app/' },
   { name: 'twitter:card', content: 'summary_large_image' },
  ],
  links: [{ rel: 'canonical', href: 'https://secondbrainv.lovable.app/' }],
 }),
 component: LandingPage,
});