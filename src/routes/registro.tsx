import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthForm } from '@/components/second-brain/auth-form';
import { supabase } from '@/integrations/supabase/client';
export const Route = createFileRoute('/registro')({
 ssr: false,
 beforeLoad: async () => { const { data } = await supabase.auth.getUser(); if (data.user) throw redirect({ to: '/chat', replace: true }); },
 head: () => ({ meta: [{ title: 'Crea tu cuenta · Second Brain' }, { name: 'description', content: 'Crea tu cuenta en Second Brain, tu asistente personal de conocimiento.' }, { property: 'og:title', content: 'Crea tu cuenta · Second Brain' }, { property: 'og:description', content: 'Accede a tu espacio personal de conocimiento.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
 component: () => <AuthForm mode="signup"/>,
});
