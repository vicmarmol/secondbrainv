import { createFileRoute } from '@tanstack/react-router';
import { SecondBrainApp } from '@/components/second-brain/app';
export const Route = createFileRoute('/_authenticated/suscripcion')({
 head: () => ({ meta: [{ title: 'Suscripción · Second Brain' }, { name: 'description', content: 'Gestiona tu prueba gratuita y tu suscripción mensual a Second Brain.' }, { property: 'og:title', content: 'Suscripción · Second Brain' }, { property: 'og:description', content: 'Tu acceso personal a Second Brain.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
 component: () => <SecondBrainApp view="billing"/>,
});
