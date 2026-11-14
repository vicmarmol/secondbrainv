const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export class NotionError extends Error {}
export function notionConfigured() { return !!process.env['NOTION_API_KEY'] && !!process.env['LOVABLE_API_KEY']; }
type NotionResponse = { results: any[]; has_more: boolean; next_cursor: string | null };
export async function notionRequest(path: string, body?: object): Promise<NotionResponse> {
 const key = process.env['NOTION_API_KEY'];
 const gatewayKey = process.env['LOVABLE_API_KEY'];
 if (!key || !gatewayKey) throw new NotionError('Notion no está configurado. Vincula el conector oficial en Lovable.');
 for (let attempt = 0; attempt < 5; attempt++) {
  await wait(350);
  const response = await fetch(`https://connector-gateway.lovable.dev/notion/v1${path}`, {
   method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${gatewayKey}`, 'X-Connection-Api-Key': key, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' },
   ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
  });
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