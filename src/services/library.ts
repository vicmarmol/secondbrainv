import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Document, DocumentType, Source } from '@/types/second-brain';

type Row = Database['public']['Tables']['documents']['Row'];
const sourceLabel: Record<Row['source'], Source> = { notion: 'Notion', drive: 'Drive', dropbox: 'Dropbox', granola: 'Granola', garmin: 'Garmin', gmail: 'Gmail' };
const typeLabel: Record<Row['type'], DocumentType> = { nota: 'nota', pdf: 'PDF', reunion: 'reunión', entreno: 'entreno' };
const statusLabel: Record<Row['status'], Document['status']> = { indexado: 'Indexado', procesando: 'Procesando', error: 'Error' };

export function toDocument(row: Row): Document {
 const modified = row.source_modified_at ?? row.updated_at;
 return { id: row.id, title: row.title, source: sourceLabel[row.source], type: typeLabel[row.type], status: row.inaccessible ? 'Sin acceso' : statusLabel[row.status], inaccessible: row.inaccessible, date: modified.slice(0, 10), summary: row.summary, tags: row.tags, content: row.content, externalUrl: row.external_url, excluded: row.excluded, createdAt: row.created_at, updatedAt: row.updated_at, chunks: [{ id: `chunk-${row.id}`, text: row.content }] };
}

/** Index entries; excluded ones are left out unless requested. */
export async function getDocuments(options: { includeExcluded?: boolean; includeInaccessible?: boolean } = {}): Promise<Document[]> {
 let query = supabase.from('documents').select('*').order('source_modified_at', { ascending: false });
 if (!options.includeExcluded) query = query.eq('excluded', false);
 if (!options.includeInaccessible) query = query.eq('inaccessible', false);
 const { data, error } = await query;
 if (error) throw new Error('No se ha podido cargar la biblioteca.');
 return (data ?? []).map(toDocument);
}

export async function searchDocuments(text: string, options: { includeExcluded?: boolean; includeInaccessible?: boolean } = {}) {
 const q = text.toLocaleLowerCase('es');
 return (await getDocuments(options)).filter(d => `${d.title} ${d.summary} ${d.tags.join(' ')}`.toLocaleLowerCase('es').includes(q));
}

export const normalizeTags = (tags: string[]) => [...new Set(tags.map(t => t.trim()).filter(Boolean))];

export async function updateDocumentTags(id: string, tags: string[]) {
 const { data, error } = await supabase.from('documents').update({ tags: normalizeTags(tags) }).eq('id', id).select('*').single();
 if (error || !data) throw new Error('No se han podido guardar las etiquetas.');
 return toDocument(data);
}

export async function setDocumentExcluded(id: string, excluded: boolean) {
 const { data, error } = await supabase.from('documents').update({ excluded }).eq('id', id).select('*').single();
 if (error || !data) throw new Error('No se ha podido actualizar el documento.');
 return toDocument(data);
}
