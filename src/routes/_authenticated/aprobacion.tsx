import { createFileRoute } from '@tanstack/react-router';
import { ApprovalWaiting } from '@/components/second-brain/approval-waiting';
export const Route = createFileRoute('/_authenticated/aprobacion')({
 head: () => ({ meta: [{ title: 'Aprobación de tu cuenta · Second Brain' }, { name: 'description', content: 'Estado de tu solicitud de acceso a Second Brain.' }, { property: 'og:title', content: 'Aprobación de tu cuenta · Second Brain' }, { property: 'og:description', content: 'Consulta la aprobación de tu espacio personal.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
 component: ApprovalWaiting,
});