export type IndexingCounts = { activeConnections: number; completedRuns: number; sampleDocuments: number; conversations: number };

/** First-sync screen only for brand-new spaces: a connected source, no finished sync and no prior use (samples or chats). */
export function needsIndexing(c: IndexingCounts) {
 return c.activeConnections > 0 && c.completedRuns === 0 && c.sampleDocuments === 0 && c.conversations === 0;
}

const SKIP_KEY = 'sb-indexing-skip';
/** "Ir al chat mientras termina" lets the user leave for this browser session without the redirect bouncing back. */
export function skipIndexingForSession() { try { sessionStorage.setItem(SKIP_KEY, '1'); } catch { /* ignore */ } }
export function indexingSkipped() { try { return typeof window !== 'undefined' && sessionStorage.getItem(SKIP_KEY) === '1'; } catch { return false; } }
