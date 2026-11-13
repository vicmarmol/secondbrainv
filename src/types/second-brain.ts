export type Source = 'Notion' | 'Drive' | 'Dropbox' | 'Granola' | 'Garmin' | 'Gmail' | 'WhatsApp' | 'Subidos manualmente';
export type DocumentType = 'nota' | 'PDF' | 'reunión' | 'entreno';
export interface Chunk { id: string; text: string }
export interface Document { id: string; title: string; source: Source; type: DocumentType; date: string; status: 'Indexado' | 'Procesando' | 'Error'; summary: string; tags: string[]; chunks: Chunk[]; content?: string; externalUrl?: string; excluded?: boolean; createdAt?: string; updatedAt?: string }
export interface Citation { document: Document; chunkId: string }
export interface Message { id: string; role: 'user' | 'assistant'; content: string; citations: Citation[]; kind?: 'conflict' | 'rides' | undefined; feedback?: 'helpful' | 'unhelpful' | undefined }
export interface Conversation { id: string; title: string; group: 'Hoy' | 'Ayer' | 'Anteriores'; updatedAt?: string; messages: Message[] }
export interface Connection { id: string; name: string; source: Source; status: 'Conectado' | 'Desconectado' | 'Próximamente'; lastSync: string | null; documentCount: number }
export interface RideWeek { week: string; current: number; previous: number }
