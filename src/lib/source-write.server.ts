import type { Db } from './sync/types';
import { connectorFor, registeredConnectors } from './sync/registry.server';
import { contentHash, SUMMARY_LENGTH } from './notion';
import type { SourceId } from './source-write';

/** Generic: active connections whose connector declares `create`, with their destinations. No source-specific logic. */
export async function writableTargets(db: Db, userId: string) {
 const { data: rows, error } = await db.from('connections').select('source,status').eq('user_id', userId).eq('status', 'conectado');
 if (error) throw new Error('No se han podido leer tus conexiones.');
 const connected = (rows ?? []).map(r => r.source as SourceId);
 const writable: { source: SourceId; destinations: { id: string; label: string }[] }[] = [];
 for (const c of registeredConnectors) {
  if (!connected.includes(c.source as SourceId) || !c.capabilities.create || !c.listDestinations || !await c.isReady(userId)) continue;
  writable.push({ source: c.source as SourceId, destinations: await c.listDestinations({ db, userId }) });
 }
 return { writable, connected };
}

export class WriteError extends Error {}
export async function createInSource(db: Db, userId: string, input: { source: SourceId; destinationId: string; title: string; content: string }) {
 const connector = connectorFor(input.source);
 if (!connector?.capabilities.create || !connector.createDocument) throw new WriteError('Esta fuente no permite crear contenido. No se ha guardado nada.');
 const { writable } = await writableTargets(db, userId);
 const target = writable.find(w => w.source === input.source);
 if (!target) throw new WriteError('Esa conexión no está activa. Conéctala en Conexiones. No se ha guardado nada.');
 if (!target.destinations.some(d => d.id === input.destinationId)) throw new WriteError('El destino elegido no está disponible. Comprueba que siga compartido. No se ha guardado nada.');
 let created;
 try { created = await connector.createDocument({ userId, destinationId: input.destinationId, title: input.title, content: input.content }); }
 catch (error) { throw new WriteError(`${connector.describeError(error).message.replace(/ Vuelve a intentarlo.*$/, '')} No se ha guardado nada.`); }
 // Store with the same external_id and hash sync uses, so the hourly sync skips it and chat finds it now.
 const hash = await contentHash(created.content);
 const { data, error } = await db.from('documents').insert({ user_id: userId, source: input.source, type: 'nota', status: 'indexado', external_id: created.externalId, title: created.title, content: created.content, summary: created.content.slice(0, SUMMARY_LENGTH), content_hash: hash, source_modified_at: created.modifiedAt, external_url: created.url }).select('id').single();
 if (error || !data) {
  try { await connector.removeDocument?.({ userId, externalId: created.externalId }); } catch { console.error('Rollback of created document failed'); }
  throw new WriteError('No se ha podido guardar en la Biblioteca y se ha deshecho la creación. No se ha guardado nada.');
 }
 const { count } = await db.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('source', input.source).eq('inaccessible', false).eq('is_sample', false);
 await db.from('connections').update({ document_count: count ?? 0 }).eq('user_id', userId).eq('source', input.source);
 return { documentId: data.id, url: created.url };
}
