import { describe, expect, it } from 'vitest';
import { boundedRetrieval, keywordQuery, searchTermsSchema } from './chat-answer';

describe('chat topic retrieval', () => {
  it('joins individual words with OR and quotes only explicit names', () => {
   expect(keywordQuery(['formato de entrega', 'delivery format'], ['second brain'])).toBe('formato OR entrega OR delivery OR format OR "second brain"');
 });
  it('allows related words without the former six-term ceiling', () => {
   expect(keywordQuery(['precio', 'coste', 'costo', 'cuesta', 'mensual', 'mes'])).toBe('precio OR coste OR costo OR cuesta OR mensual OR mes');
   expect(searchTermsSchema.safeParse({ terms: [] }).success).toBe(false);
   expect(searchTermsSchema.safeParse({ terms: Array.from({ length: 25 }, (_, i) => `term${i}`) }).success).toBe(false);
 });
 it('retains the best eight documents', () => {
  const docs = Array.from({ length: 10 }, (_, id) => ({ id, excerpt: 'text' }));
  expect(boundedRetrieval(docs).map(d => d.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
 });
 it('keeps the existing 3000 character excerpt limit', () => {
  expect(boundedRetrieval([{ excerpt: 'x'.repeat(3100) }])[0]?.excerpt).toBe('x'.repeat(3000));
 });
 it('prevents model terms from injecting OR or negation operators', () => {
   expect(keywordQuery(['Second brain" OR "everything', '-segundo cerebro', 'project'])).toBe('second OR brain OR everything OR segundo OR cerebro OR project');
 });
});