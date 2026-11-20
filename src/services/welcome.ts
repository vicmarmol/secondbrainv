import { supabase } from '@/integrations/supabase/client';
import type { WelcomeCounts } from '@/lib/welcome';

export async function getWelcomeCounts(): Promise<WelcomeCounts> {
 const [connections, documents] = await Promise.all([
  supabase.from('connections').select('id', { count: 'exact', head: true }).eq('status', 'conectado'),
  supabase.from('documents').select('id', { count: 'exact', head: true }),
 ]);
 if (connections.error || documents.error || connections.count === null || documents.count === null) throw new Error('No se ha podido comprobar tu espacio. Inténtalo de nuevo.');
 return { activeConnections: connections.count, documents: documents.count };
}

/** Same popup, callback contract and authenticated exchange used by the Connections page. */
export async function connectWelcomeNotion(
 start: () => Promise<{ authorizationUrl: string }>,
 complete: (input: { data: { code: string; nonce: string; mode: 'connect' } }) => Promise<unknown>,
) {
 const popup = window.open('', 'notion-oauth', 'width=600,height=720');
 if (!popup) throw new Error('No se pudo conectar. Inténtalo de nuevo');
 try {
  const { authorizationUrl } = await start();
  const result = new Promise<{ code: string; nonce: string }>((resolve, reject) => {
   const cleanup = () => { window.removeEventListener('message', listener); window.clearInterval(poll); window.clearTimeout(timeout); };
   const listener = (event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.source !== popup || event.data?.connectorId !== 'notion') return;
    if (event.data?.type !== 'appUserConnectorOAuthComplete' && event.data?.type !== 'appUserConnectorOAuthFailed') return;
    cleanup();
    if (event.data.type === 'appUserConnectorOAuthComplete' && typeof event.data.code === 'string' && typeof event.data.nonce === 'string') resolve({ code: event.data.code, nonce: event.data.nonce });
    else reject(new Error('No se pudo conectar. Inténtalo de nuevo'));
   };
   const poll = window.setInterval(() => { if (popup.closed) { cleanup(); reject(new Error('No se pudo conectar. Inténtalo de nuevo')); } }, 500);
   const timeout = window.setTimeout(() => { cleanup(); reject(new Error('No se pudo conectar. Inténtalo de nuevo')); }, 10 * 60 * 1000);
   window.addEventListener('message', listener);
  });
  popup.location.href = authorizationUrl;
  await complete({ data: { ...await result, mode: 'connect' } });
 } finally { popup.close(); }
}