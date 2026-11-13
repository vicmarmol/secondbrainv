import type { Connection } from '@/types/second-brain';
export const connections: Connection[] = [
 { id: 'notion', name: 'Notion', source: 'Notion', status: 'Conectado', lastSync: '2026-11-13', documentCount: 7 },
 { id: 'drive', name: 'Google Drive', source: 'Drive', status: 'Conectado', lastSync: '2026-11-13', documentCount: 4 },
 { id: 'dropbox', name: 'Dropbox', source: 'Dropbox', status: 'Conectado', lastSync: '2026-11-12', documentCount: 2 },
 { id: 'granola', name: 'Granola', source: 'Granola', status: 'Conectado', lastSync: '2026-11-13', documentCount: 5 },
 { id: 'garmin', name: 'Garmin / Strava', source: 'Garmin', status: 'Conectado', lastSync: '2026-11-13', documentCount: 3 },
 { id: 'gmail', name: 'Gmail', source: 'Gmail', status: 'Próximamente', lastSync: null, documentCount: 0 },
 { id: 'whatsapp', name: 'WhatsApp', source: 'WhatsApp', status: 'Próximamente', lastSync: null, documentCount: 0 },
];
