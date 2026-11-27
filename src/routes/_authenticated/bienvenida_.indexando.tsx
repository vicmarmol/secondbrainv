import { createFileRoute, redirect } from '@tanstack/react-router';
import { IndexingPage } from '@/components/second-brain/indexing';
import { getWelcomeCounts } from '@/services/welcome';
import { needsWelcome } from '@/lib/welcome';
import { getIndexingCounts } from '@/services/indexing';
import { needsIndexing } from '@/lib/onboarding';

export const Route = createFileRoute('/_authenticated/bienvenida_/indexando')({
 beforeLoad: async () => {
  if (needsWelcome(await getWelcomeCounts())) throw redirect({ to: '/bienvenida', replace: true });
  if (!needsIndexing(await getIndexingCounts())) throw redirect({ to: '/chat', replace: true });
 },
 head: () => ({ meta: [{ title: 'Leyendo tus documentos · Second Brain' }, { name: 'description', content: 'Primera sincronización de tus fuentes en Second Brain.' }, { name: 'robots', content: 'noindex' }] }),
 component: IndexingPage,
});
