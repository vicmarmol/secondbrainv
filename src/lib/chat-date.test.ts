import { describe, expect, it } from 'vitest';
import { dateIntent, periodBounds } from './chat-date';
describe('date queries', () => {
 it('recognizes recent, new and updated queries without requiring a topic', () => {
  for (const q of ['¿qué documentos he actualizado últimamente?', 'revisa lo último que he editado', 'lo reciente', 'documentos nuevos', 'lo último sobre product builder']) expect(dateIntent(q)).toEqual({ period: null });
 });
 it('leaves ordinary topic retrieval unchanged', () => { expect(dateIntent('¿tengo algún proyecto en marcha sobre un second brain?')).toBeNull(); });
 const now = new Date('2026-11-17T19:11:00Z');
 it('uses this Monday-start week in Madrid', () => { expect(periodBounds(dateIntent('esta semana')?.period ?? null, now)).toEqual({ period_start: '2026-11-15T23:00:00.000Z', period_end: '2026-11-22T23:00:00.000Z' }); });
 it('uses this calendar month in Madrid', () => { expect(periodBounds('month', now)).toEqual({ period_start: '2026-10-31T23:00:00.000Z', period_end: '2026-11-30T23:00:00.000Z' }); });
 it('uses the previous complete week in Madrid', () => { expect(periodBounds(dateIntent('la semana pasada')?.period ?? null, now)).toEqual({ period_start: '2026-11-08T23:00:00.000Z', period_end: '2026-11-15T23:00:00.000Z' }); });
 it('handles summer time at calendar boundaries', () => { expect(periodBounds('month', new Date('2026-07-17T00:00:00Z'))).toEqual({ period_start: '2026-06-30T22:00:00.000Z', period_end: '2026-07-31T22:00:00.000Z' }); });
 it('has no date restriction without a period', () => { expect(periodBounds(null, now)).toEqual({}); });
});