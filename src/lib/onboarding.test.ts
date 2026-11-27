import { describe, expect, it } from 'vitest';
import { needsIndexing } from './onboarding';
const base = { activeConnections: 1, completedRuns: 0, sampleDocuments: 0, conversations: 0 };
describe('needsIndexing', () => {
 it('applies right after connecting the first source', () => expect(needsIndexing(base)).toBe(true));
 it('stops once the first sync has finished', () => expect(needsIndexing({ ...base, completedRuns: 1 })).toBe(false));
 it('does not apply when nothing is connected', () => expect(needsIndexing({ ...base, activeConnections: 0 })).toBe(false));
 it('does not apply to users who already used the app', () => {
  expect(needsIndexing({ ...base, conversations: 2 })).toBe(false);
  expect(needsIndexing({ ...base, sampleDocuments: 5 })).toBe(false);
 });
});
