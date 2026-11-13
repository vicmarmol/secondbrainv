import { createFileRoute } from '@tanstack/react-router';
import { SecondBrainApp } from '@/components/second-brain/app';
export const Route = createFileRoute('/')({
 head: () => ({ meta: [{ title: 'Second Brain · Tu conocimiento, conectado' }, { name: 'description', content: 'Recupera ideas, decisiones y conocimiento con respuestas que citan tus fuentes.' }, { property: 'og:title', content: 'Second Brain · Tu conocimiento, conectado' }, { property: 'og:description', content: 'Tu asistente personal para recordar y conectar información.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
 component: () => <SecondBrainApp/>,
});
