import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
const gatewayBaseUrl = 'https://connector-gateway.lovable.dev';
export const startNotionConnect = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const { requireAppAccess } = await import('./billing.server'); await requireAppAccess(context.supabase);
 const clientAPIKey = process.env['NOTION_APP_USER_CONNECTOR_CLIENT_API_KEY'];
 if (!clientAPIKey) throw new Error('Configura el conector de usuario de Notion en Lovable.');
 const request = getRequest();
 const url = new URL(request.url);
 const host = url.hostname === 'localhost' ? request.headers.get('x-forwarded-host') : null;
 const nonce = crypto.randomUUID();
 const { error } = await context.supabase.from('connections').update({ notion_oauth_nonce: nonce }).eq('user_id', context.userId).eq('source', 'notion');
 if (error) throw new Error('No se ha podido iniciar la conexión.');
 const returnUrl = new URL('/api/public/oauth/notion/return', host ? `https://${host}` : url.origin);
 returnUrl.searchParams.set('nonce', nonce);
 const { authorizeAppUserOAuth } = await import('@/integrations/lovable/appUserConnector');
 return authorizeAppUserOAuth({ gatewayBaseUrl, connectorId: 'notion', appUserId: context.userId, clientAPIKey, returnUrl: returnUrl.toString() });
});
export const completeNotionConnect = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ code: z.string().min(1).max(4096), nonce: z.string().uuid() })).handler(async ({ context, data }) => {
 const { requireAppAccess } = await import('./billing.server'); await requireAppAccess(context.supabase);
 // Claim a one-time nonce belonging to this authenticated user before redeeming the code.
 const claimed = await context.supabase.from('connections').update({ notion_oauth_nonce: null }).eq('user_id', context.userId).eq('source', 'notion').eq('notion_oauth_nonce', data.nonce).select('id').maybeSingle();
 if (claimed.error || !claimed.data) throw new Error('La autorización ha caducado o pertenece a otra cuenta.');
 const { exchangeAppUserOAuthCode } = await import('@/integrations/lovable/appUserConnector');
 const { saveConnectionKeyForUser } = await import('./appUserConnections.server');
 const result = await exchangeAppUserOAuthCode(gatewayBaseUrl, data.code);
 if (result.connectorId !== 'notion') throw new Error('La autorización no corresponde a Notion.');
 await saveConnectionKeyForUser(context.userId, 'notion', result.connectionAPIKey);
 // Pending discovery belongs to the previous workspace: never reuse it after consent.
 const { error: runsError } = await context.supabase.from('sync_runs').update({ status: 'error', finished_at: new Date().toISOString(), error_message: 'La conexión de Notion ha cambiado.' }).eq('user_id', context.userId).eq('connection_id', claimed.data.id).eq('status', 'en_curso');
 if (runsError) throw new Error('No se ha podido restablecer la sincronización.');
 const { error } = await context.supabase.from('connections').update({ status: 'conectado', notion_cursor: null }).eq('id', claimed.data.id).eq('user_id', context.userId);
 if (error) throw new Error('No se ha podido guardar el estado de Notion.');
 return { ok: true };
});
export const disconnectNotion = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const { getConnectionKeyForUser, deleteConnectionKeyForUser } = await import('./appUserConnections.server');
 const { disconnectAppUser } = await import('@/integrations/lovable/appUserConnector');
 const connectionAPIKey = await getConnectionKeyForUser(context.userId, 'notion');
 if (connectionAPIKey) await disconnectAppUser({ gatewayBaseUrl, connectorId: 'notion', connectionAPIKey });
 await deleteConnectionKeyForUser(context.userId, 'notion');
 const { data: connection, error: readError } = await context.supabase.from('connections').select('id').eq('user_id', context.userId).eq('source', 'notion').single();
 if (readError || !connection) throw new Error('No se ha podido leer tu conexión.');
 const { error: runError } = await context.supabase.from('sync_runs').update({ status: 'error', error_message: 'Notion desconectado.', finished_at: new Date().toISOString() }).eq('user_id', context.userId).eq('connection_id', connection.id).eq('status', 'en_curso');
 if (runError) throw new Error('No se ha podido detener la sincronización.');
 const { error } = await context.supabase.from('connections').update({ status: 'desconectado', notion_cursor: null, notion_oauth_nonce: null }).eq('id', connection.id).eq('user_id', context.userId);
 if (error) throw new Error('No se ha podido desconectar Notion.');
 return { ok: true };
});