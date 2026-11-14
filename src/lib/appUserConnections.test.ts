import { beforeEach, describe, expect, it, vi } from 'vitest';
const rows = vi.hoisted(() => new Map<string, string>());
vi.mock('./connectionKeyCrypto.server', () => ({ encryptConnectionKey: (s: string) => `encrypted:${s}`, decryptConnectionKey: (s: string) => s.slice(10) }));
vi.mock('@/integrations/supabase/client.server', () => ({ supabaseAdmin: { from: () => ({
 select: () => {
  const filters: Record<string, string> = {};
  const query = { eq: (k: string, v: string) => { filters[k] = v; return query; }, maybeSingle: async () => ({ data: rows.has(`${filters['user_id']}:${filters['connector_id']}`) ? { connection_key_ciphertext: rows.get(`${filters['user_id']}:${filters['connector_id']}`) } : null, error: null }) };
  return query;
 },
 upsert: async (row: { user_id: string; connector_id: string; connection_key_ciphertext: string }) => { rows.set(`${row.user_id}:${row.connector_id}`, row.connection_key_ciphertext); return { error: null }; },
 }) } }));
import { getConnectionKeyForUser, saveConnectionKeyForUser } from './appUserConnections.server';
describe('Conexiones de Notion individuales', () => {
 beforeEach(() => rows.clear());
 it('no usa las credenciales de Laura al sincronizar Pablo', async () => {
  await saveConnectionKeyForUser('laura', 'notion', 'laura-key');
  expect(await getConnectionKeyForUser('pablo', 'notion')).toBeNull();
  expect(await getConnectionKeyForUser('laura', 'notion')).toBe('laura-key');
 });
 it('cada usuario recupera exclusivamente su propia conexión', async () => {
  await saveConnectionKeyForUser('laura', 'notion', 'laura-key');
  await saveConnectionKeyForUser('pablo', 'notion', 'pablo-key');
  expect(await getConnectionKeyForUser('laura', 'notion')).toBe('laura-key');
  expect(await getConnectionKeyForUser('pablo', 'notion')).toBe('pablo-key');
 });
 it('una reconexión sustituye la clave anterior sin modificar otras cuentas', async () => {
  await saveConnectionKeyForUser('laura', 'notion', 'old');
  await saveConnectionKeyForUser('pablo', 'notion', 'other');
  await saveConnectionKeyForUser('laura', 'notion', 'new');
  expect(await getConnectionKeyForUser('laura', 'notion')).toBe('new');
  expect(await getConnectionKeyForUser('pablo', 'notion')).toBe('other');
 });
});