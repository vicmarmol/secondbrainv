import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendMessage, getDocuments, getRides } from './index';
async function resolve<T>(promise: Promise<T>) { await vi.runAllTimersAsync(); return promise; }
afterEach(() => vi.useRealTimers());
describe('Simulated Second Brain responses', () => {
 it('MVP preserves both conflicting sources and their dates', async () => { vi.useFakeTimers(); const answer = await resolve(sendMessage('¿Qué es un MVP?')); expect(answer.kind).toBe('conflict'); expect(answer.citations.map(c => [c.document.source, c.document.date])).toEqual([['Drive','2026-10-30'],['Notion','2026-10-13']]); });
 it('meeting references yesterday and includes three decisions and two tasks', async () => { vi.useFakeTimers(); const answer = await resolve(sendMessage('Última reunión')); expect(answer.citations[0]?.document.date).toBe('2026-11-12'); expect(answer.content).toContain('3. Posponer'); expect(answer.content).toContain('Laura:'); expect(answer.content).toContain('Pablo:'); expect(answer.citations[0]?.document.source).toBe('Granola'); });
 it('cycling compares the same two weeks and cites Garmin', async () => { vi.useFakeTimers(); const answer = await resolve(sendMessage('Mis salidas en bici')); const rows = await resolve(getRides()); expect(answer.kind).toBe('rides'); expect(answer.citations[0]?.document.source).toBe('Garmin'); expect(rows.map(r => r.current)).toEqual([112,138]); expect(rows.map(r => r.previous)).toEqual([86,104]); });
 it('pricing cites both the email and meeting', async () => { vi.useFakeTimers(); const answer = await resolve(sendMessage('¿Con quién hablé sobre pricing?')); expect(answer.citations.map(c => c.document.source)).toEqual(['Gmail','Granola']); expect(answer.content).toContain('Marta Ruiz'); expect(answer.content).toContain('Diego Martín'); });
 it('unmatched questions return no invented citations', async () => { vi.useFakeTimers(); const answer = await resolve(sendMessage('Receta de gazpacho')); expect(answer.citations).toEqual([]); expect(answer.kind).toBeUndefined(); });
 it('provides twenty documents and isolates fixture state', async () => { vi.useFakeTimers(); const docs = await resolve(getDocuments()); expect(docs).toHaveLength(20); docs[0].title = 'changed'; const fresh = await resolve(getDocuments()); expect(fresh[0].title).not.toBe('changed'); });
});
