import { getConnectionKeyForUser } from './appUserConnections.server';
import { callAsAppUser, appUserReconnectRequired } from '@/integrations/lovable/appUserConnector';
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export class NotionError extends Error {}
export class NotionReconnectError extends NotionError {}
export async function notionConfigured(userId: string) { return !!await getConnectionKeyForUser(userId, 'notion'); }
type NotionResponse = { results: any[]; has_more: boolean; next_cursor: string | null };
export async function notionRequest(userId: string, path: string, body?: object, method?: 'POST' | 'PATCH'): Promise<NotionResponse> {
 const key = await getConnectionKeyForUser(userId, 'notion');
 if (!key) throw new NotionError('Conecta tu cuenta de Notion antes de sincronizar.');
 for (let attempt = 0; attempt < 5; attempt++) {
  await wait(350);
   const response = await callAsAppUser({ gatewayBaseUrl: 'https://connector-gateway.lovable.dev', connectorId: 'notion', connectionAPIKey: key, path: `/v1${path}`, init: {
    method: method ?? (body ? 'POST' : 'GET'), headers: { 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' },
   ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
   } });
   if (await appUserReconnectRequired(response)) throw new NotionReconnectError('Tu acceso a Notion necesita renovarse. Vuelve a conectar.');
  if (response.status === 429 && attempt < 4) {
   await response.text();
   const seconds = Number(response.headers.get('Retry-After') ?? 2 ** attempt);
   if (seconds > 30) throw new NotionError('Notion ha limitado las peticiones. Espera un momento y vuelve a sincronizar.');
   await wait(Math.max(1, seconds || 1) * 1000); continue;
  }
  if (!response.ok) {
   // Never log provider bodies: they may contain credentials or private content.
   await response.text();
   console.error('Notion request failed', response.status);
   throw new NotionError(response.status === 401 ? 'Notion ha rechazado la conexión. Vuelve a autorizar el conector.' : response.status === 403 || response.status === 404 ? 'Una página ya no está disponible. Comprueba que esté compartida con la integración.' : response.status === 429 ? 'Notion ha limitado las peticiones. Espera y vuelve a sincronizar.' : `Notion no ha podido responder (HTTP ${response.status}). Vuelve a intentarlo.`);
  }
  return response.json();
 }
 throw new NotionError('No se ha podido acceder a Notion.');
}