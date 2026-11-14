import { describe, it, expect } from 'vitest';
import { MAX_RESULTS, MAX_EXCERPT, validateAnswer } from '@/lib/chat-answer';
describe('Real document answers', () => {
 it('retrieval is limited to six documents', () => expect(MAX_RESULTS).toBe(6));
 it('each excerpt is limited to 3000 characters', () => expect(MAX_EXCERPT).toBe(3000));
 it('rejects citations outside the retrieved set', () => expect(() => validateAnswer({ text: 'Respuesta', document_ids: ['other'], conflicts: [], difference: '' }, ['mine'])).toThrow());
 it('does not accept empty answers', () => expect(() => validateAnswer({ text: ' ', document_ids: [], conflicts: [], difference: '' }, [])).toThrow());
 it('includes both conflicting source ids', () => expect(validateAnswer({ text: 'Dos versiones', document_ids: ['a'], conflicts: [{ document_id: 'a', version: 'Uno' }, { document_id: 'b', version: 'Dos' }], difference: 'Difieren' }, ['a','b']).document_ids).toEqual(['a','b']));
});
