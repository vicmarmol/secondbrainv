import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/api/public/oauth/notion/return')({
 server: { handlers: { GET: async ({ request }) => {
  // No app credentials here: this only relays a one-time code to its same-origin opener.
  const url = new URL(request.url);
  const message = {
   type: url.searchParams.get('success') === 'true' && url.searchParams.get('code') ? 'appUserConnectorOAuthComplete' : 'appUserConnectorOAuthFailed',
   connectorId: url.searchParams.get('connector_id'), code: url.searchParams.get('code'), nonce: url.searchParams.get('nonce'),
  };
  const json = JSON.stringify(message).replace(/</g, '\\u003c');
  return new Response(`<!doctype html><html lang="es"><head><title>Conexión Notion · Second Brain</title></head><body><p>Finalizando autorización de Notion…</p><script>if(window.opener){window.opener.postMessage(${json},window.location.origin);window.close();}</script></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
 } } },
});