import { describe, expect, it, vi } from 'vitest';
import { retrieveWithFallback } from './chat-retrieval';
import { questionWords } from './chat-answer';

describe('empty-result fallback', () => {
 it('retries the delivery question with individual non-stopwords', async () => {
  const search = vi.fn().mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: [{ title: 'Notas reunión de arranque' }], error: null });
  const result = await retrieveWithFallback('¿Qué formato tiene la entrega?', 'submission', search);
  expect(search.mock.calls.map(call => call[0])).toEqual(['submission', 'formato OR entrega']);
  expect(result.data).toEqual([{ title: 'Notas reunión de arranque' }]);
 });
 it('retains the meaningful monthly-cost words', () => {
  expect(questionWords('¿Cuánto cuesta la herramienta al mes?')).toEqual(['cuesta', 'herramienta', 'mes']);
 });
 it('does not broaden successful results', async () => {
  const search = vi.fn().mockResolvedValue({ data: [{ id: 'doc' }], error: null });
  await retrieveWithFallback('¿Qué es Product Builder?', '"product builder"', search);
  expect(search).toHaveBeenCalledTimes(1);
 });
 it('does not retry database failures', async () => {
  const search = vi.fn().mockResolvedValue({ data: null, error: 'denied' });
  expect((await retrieveWithFallback('¿Qué formato tiene la entrega?', 'format', search)).error).toBe('denied');
  expect(search).toHaveBeenCalledTimes(1);
 });
 it('keeps an unsupported car question empty after both attempts', async () => {
  const search = vi.fn().mockResolvedValue({ data: [], error: null });
  const result = await retrieveWithFallback('¿Cuál es el precio de mi coche en 2030?', 'automovil', search);
  expect(result.attempts).toEqual([{ query: 'automovil', count: 0 }, { query: 'precio OR coche OR 2030', count: 0 }]);
  expect(result.data).toEqual([]);
 });
 it('never adds generic date words to an unfiltered date query', async () => {
  const search = vi.fn().mockResolvedValue({ data: [], error: null });
  await retrieveWithFallback('¿Qué documentos recientes hay?', '', search, false);
  expect(search).toHaveBeenCalledTimes(1);
 });
});