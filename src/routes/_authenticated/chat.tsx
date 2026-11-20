import { createFileRoute } from '@tanstack/react-router';
import { SecondBrainApp } from '@/components/second-brain/app';
export const Route = createFileRoute('/_authenticated/chat')({
 head: () => ({ meta: [{ title: 'Chat · Second Brain' }, { name: 'description', content: 'Recupera ideas, decisiones y conocimiento con respuestas que citan tus fuentes.' }, { property: 'og:title', content: 'Chat · Second Brain' }, { property: 'og:description', content: 'Tu asistente personal para recordar y conectar información.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
 component: () => <SecondBrainApp/>,
});