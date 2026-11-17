import { describe, expect, it } from 'vitest';
import { boundedRetrieval, keywordQuery, searchTermsSchema } from './chat-answer';

describe('chat topic retrieval', () => {
 it('joins bilingual topics with OR instead of requiring every question word', () => {
  expect(keywordQuery(['second brain', 'segundo cerebro', 'proyecto', 'project'])).toBe('"second brain" OR "segundo cerebro" OR "proyecto" OR "project"');
 });
 it('requires three to six model-extracted terms', () => {
  expect(searchTermsSchema.safeParse({ terms: ['one', 'two'] }).success).toBe(false);
  expect(searchTermsSchema.safeParse({ terms: ['one', 'two', 'three'] }).success).toBe(true);
  expect(searchTermsSchema.safeParse({ terms: Array.from({ length: 7 }, (_, i) => `term${i}`) }).success).toBe(false);
 });
 it('retains the best eight documents', () => {
  const docs = Array.from({ length: 10 }, (_, id) => ({ id, excerpt: 'text' }));
  expect(boundedRetrieval(docs).map(d => d.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
 });
 it('keeps the existing 3000 character excerpt limit', () => {
  expect(boundedRetrieval([{ excerpt: 'x'.repeat(3100) }])[0]?.excerpt).toBe('x'.repeat(3000));
 });
 it('prevents model terms from injecting OR or negation operators', () => {
  expect(keywordQuery(['Second brain" OR "everything', '-segundo cerebro', 'project'])).toBe('"second brain or everything" OR "segundo cerebro" OR "project"');
 });
});