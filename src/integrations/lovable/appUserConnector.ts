/** Server-only gateway helpers. Import exclusively inside server handlers. */
function requireApiKey() {
 const key = process.env['LOVABLE_API_KEY'];
 if (!key) throw new Error('Falta la configuración de Lovable.');
 return key;
}
async function gatewayJson(url: string, init: RequestInit) {
 const res = await fetch(url, init);
 const text = await res.text();
 if (!res.ok) throw new Error(`App User Connector (${res.status}): ${text}`);
 return JSON.parse(text);
}
export async function authorizeAppUserOAuth(params: { gatewayBaseUrl: string; connectorId: string; appUserId: string; clientAPIKey: string; returnUrl: string; credentialsConfiguration?: Record<string, unknown> }) {
 const body = await gatewayJson(`${params.gatewayBaseUrl}/api/v1/app-users/oauth2/authorize`, {
  method: 'POST', headers: { Authorization: `Bearer ${requireApiKey()}`, 'Content-Type': 'application/json', 'X-Client-Api-Key': params.clientAPIKey },
  body: JSON.stringify({ connector_id: params.connectorId, app_user_id: params.appUserId, return_url: params.returnUrl, credentials_configuration: params.credentialsConfiguration }),
 });
 if (!body.authorization_url) throw new Error('Falta la URL de autorización.');
 return { authorizationUrl: String(body.authorization_url), sessionId: String(body.session_id ?? '') };
}
export async function exchangeAppUserOAuthCode(gatewayBaseUrl: string, code: string) {
 const body = await gatewayJson(`${gatewayBaseUrl}/api/v1/app-users/oauth2/exchange`, { method: 'POST', headers: { Authorization: `Bearer ${requireApiKey()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
 if (!body.api_key || !body.connector_id) throw new Error('No se ha recibido la conexión.');
 return { connectionAPIKey: String(body.api_key), connectorId: String(body.connector_id) };
}
export function callAsAppUser(params: { gatewayBaseUrl: string; connectionAPIKey: string; connectorId: string; path: string; init?: RequestInit; requiredScopes?: string[] }) {
 const headers = new Headers(params.init?.headers);
 headers.set('Authorization', `Bearer ${requireApiKey()}`);
 headers.set('X-Connection-Api-Key', params.connectionAPIKey);
 if (params.requiredScopes?.length) headers.set('X-Lovable-Required-Scopes', params.requiredScopes.join(' '));
 return fetch(`${params.gatewayBaseUrl}/${params.connectorId}${params.path.startsWith('/') ? params.path : `/${params.path}`}`, { ...params.init, headers });
}
export async function appUserReconnectRequired(res: Response) {
 if (res.status !== 401) return false;
 const body = await res.clone().json().catch(() => null) as { type?: unknown } | null;
 return typeof body?.type === 'string' && body.type.startsWith('credential_');
}
export async function disconnectAppUser(params: { gatewayBaseUrl: string; connectionAPIKey: string; connectorId: string }) {
 await gatewayJson(`${params.gatewayBaseUrl}/api/v1/app-users/connection`, { method: 'DELETE', headers: { Authorization: `Bearer ${requireApiKey()}`, 'X-Connection-Api-Key': params.connectionAPIKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ connector_id: params.connectorId }) });
}