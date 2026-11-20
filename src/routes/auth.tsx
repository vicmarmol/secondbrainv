import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/auth')({
 ssr: false,
 beforeLoad: () => { throw redirect({ to: '/login', replace: true }); },
 head: () => ({ meta: [{ title: 'Inicia sesión · Second Brain' }, { name: 'description', content: 'Inicia sesión en Second Brain, tu asistente personal de conocimiento.' }, { property: 'og:title', content: 'Inicia sesión · Second Brain' }, { property: 'og:description', content: 'Accede a tu espacio personal de conocimiento.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
});
