import { describe, it, expect } from 'vitest';
import { boundedRetrieval, validateAnswer } from '@/lib/chat-answer';
describe('Real document answers', () => {
 it('retrieval is limited to eight documents', () => expect(boundedRetrieval(Array.from({ length: 9 }, () => ({ excerpt: 'texto' })))).toHaveLength(8));
 it('each excerpt is limited to 3000 characters', () => expect(boundedRetrieval([{ excerpt: 'a'.repeat(4000) }])[0]?.excerpt).toHaveLength(3000));
 it('rejects citations outside the retrieved set', () => expect(() => validateAnswer({ text: 'Respuesta', document_ids: ['other'], conflicts: [], difference: '' }, ['mine'])).toThrow());
 it('does not accept empty answers', () => expect(() => validateAnswer({ text: ' ', document_ids: [], conflicts: [], difference: '' }, [])).toThrow());
 it('includes both conflicting source ids', () => expect(validateAnswer({ text: 'Dos versiones', document_ids: ['a'], conflicts: [{ document_id: 'a', version: 'Uno' }, { document_id: 'b', version: 'Dos' }], difference: 'Difieren' }, ['a','b']).document_ids).toEqual(['a','b']));
});
