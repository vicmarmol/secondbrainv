import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { Conversation, Message } from '@/types/second-brain';
import { toDocument } from './library';

const madridDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/** Groups by calendar day in Europe/Madrid. */
export function groupFor(updatedAt: string, now = new Date()): Conversation['group'] {
 const day = madridDay(new Date(updatedAt));
 if (day === madridDay(now)) return 'Hoy';
 const yesterday = new Date(`${madridDay(now)}T12:00:00Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
 return day === yesterday.toISOString().slice(0, 10) ? 'Ayer' : 'Anteriores';
}

type StoredCitation = { document_id: string; chunk_id?: string };

export async function getConversations(): Promise<Conversation[]> {
 const [convs, msgs] = await Promise.all([
  supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
  supabase.from('messages').select('*').order('created_at'),
 ]);
 if (convs.error || msgs.error) throw new Error('No se han podido cargar las conversaciones.');
 const ids = [...new Set((msgs.data ?? []).flatMap(m => ((m.citations as StoredCitation[]) ?? []).map(c => c.document_id)))];
 const docs = ids.length ? (await supabase.from('documents').select('*').in('id', ids)).data ?? [] : [];
 const byId = new Map(docs.map(d => [d.id, toDocument(d)]));
 return (convs.data ?? []).map(c => ({ id: c.id, title: c.title, group: groupFor(c.updated_at), updatedAt: c.updated_at, messages: (msgs.data ?? []).filter(m => m.conversation_id === c.id).map(m => ({ id: m.id, role: m.role, content: m.content, citations: ((m.citations as StoredCitation[]) ?? []).flatMap(s => { const document = byId.get(s.document_id); return document ? [{ document, chunkId: s.chunk_id ?? document.chunks[0]?.id ?? '' }] : []; }) })) }));
}

export async function createConversation(id: string, title: string) {
 const { error } = await supabase.from('conversations').insert({ id, title: title.slice(0, 120) });
 if (error) throw new Error('No se ha podido guardar la conversación.');
}

export async function saveMessage(conversationId: string, message: Message) {
 const citations: StoredCitation[] = message.citations.map(c => ({ document_id: c.document.id, chunk_id: c.chunkId }));
 const { error } = await supabase.from('messages').insert({ id: message.id, conversation_id: conversationId, role: message.role, content: message.content, citations: citations as unknown as Json });
 if (error) throw new Error('No se ha podido guardar el mensaje.');
}

export async function renameConversation(id: string, title: string) {
 const clean = title.trim();
 if (!clean) throw new Error('El título no puede estar vacío.');
 const { error } = await supabase.from('conversations').update({ title: clean }).eq('id', id);
 if (error) throw new Error('No se ha podido renombrar la conversación.');
}

export async function deleteConversation(id: string) {
 const { error } = await supabase.from('conversations').delete().eq('id', id);
 if (error) throw new Error('No se ha podido borrar la conversación.');
}
