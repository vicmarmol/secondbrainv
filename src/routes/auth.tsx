import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthForm } from '@/components/second-brain/auth-form';
import { supabase } from '@/integrations/supabase/client';
export const Route = createFileRoute('/auth')({
 ssr: false,
 beforeLoad: async () => { const { data } = await supabase.auth.getSession(); if (data.session) throw redirect({ to: '/' }); },
 head: () => ({ meta: [{ title: 'Inicia sesión · Second Brain' }, { name: 'description', content: 'Inicia sesión en Second Brain, tu asistente personal de conocimiento.' }, { property: 'og:title', content: 'Inicia sesión · Second Brain' }, { property: 'og:description', content: 'Accede a tu espacio personal de conocimiento.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
 component: () => <AuthForm mode="login"/>,
});
