import { createFileRoute, redirect } from '@tanstack/react-router';
import { WelcomePage } from '@/components/second-brain/welcome';
import { getWelcomeCounts } from '@/services/welcome';
import { needsWelcome } from '@/lib/welcome';

export const Route = createFileRoute('/_authenticated/bienvenida')({
 beforeLoad: async () => { if (!needsWelcome(await getWelcomeCounts())) throw redirect({ to: '/chat', replace: true }); },
 head: () => ({ meta: [
  { title: 'Conecta tu primera herramienta · Second Brain' },
  { name: 'description', content: 'Conecta tus fuentes personales o explora Second Brain con datos de ejemplo.' },
  { property: 'og:title', content: 'Conecta tu primera herramienta · Second Brain' },
  { property: 'og:description', content: 'Empieza tu espacio de conocimiento conectando Notion.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
 ] }),
 component: WelcomePage,
});