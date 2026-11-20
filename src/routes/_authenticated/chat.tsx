import { createFileRoute, redirect } from '@tanstack/react-router';
import { SecondBrainApp } from '@/components/second-brain/app';
import { getWelcomeCounts } from '@/services/welcome';
import { needsWelcome } from '@/lib/welcome';
export const Route = createFileRoute('/_authenticated/chat')({
 beforeLoad: async () => { if (needsWelcome(await getWelcomeCounts())) throw redirect({ to: '/bienvenida', replace: true }); },
 head: () => ({ meta: [{ title: 'Chat · Second Brain' }, { name: 'description', content: 'Recupera ideas, decisiones y conocimiento con respuestas que citan tus fuentes.' }, { property: 'og:title', content: 'Chat · Second Brain' }, { property: 'og:description', content: 'Tu asistente personal para recordar y conectar información.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
 component: () => <SecondBrainApp/>,
});