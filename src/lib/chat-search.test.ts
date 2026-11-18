import { beforeEach, describe, expect, it, vi } from 'vitest';

const { stream, responses } = vi.hoisted(() => ({ stream: vi.fn(), responses: vi.fn(() => 'model') }));
vi.mock('ai', () => ({ streamText: stream, generateText: vi.fn(), Output: { object: (value: unknown) => value } }));
vi.mock('@ai-sdk/openai', () => ({ createOpenAI: () => ({ responses }) }));
import { rewriteFollowUpQuestion } from './chat-search.server';

describe('standalone follow-up questions', () => {
 beforeEach(() => { vi.clearAllMocks(); });
 const signal = new AbortController().signal;
 it('does not rewrite a first question without previous messages', async () => {
  expect(await rewriteFollowUpQuestion('¿Qué dice Product Builder?', [], 'test', signal)).toBe('¿Qué dice Product Builder?');
  expect(stream).not.toHaveBeenCalled();
 });
 it('uses only the last four messages in their conversation order', async () => {
  const history = Array.from({ length: 6 }, (_, i) => ({ role: i % 2 ? 'assistant' as const : 'user' as const, content: `${i}: Product Builder` }));
  stream.mockReturnValue({ output: Promise.resolve({ changed: true, question: '¿qué más dice el documento Product Builder?' }) });
  expect(await rewriteFollowUpQuestion('¿y qué más dice ese documento?', history, 'test', signal)).toBe('¿qué más dice el documento Product Builder?');
  expect(JSON.parse(stream.mock.calls[0]?.[0].prompt).history).toEqual(history.slice(2));
  expect(stream.mock.calls[0]?.[0].abortSignal).toBe(signal);
 });
 it('keeps a self-contained question exactly as originally written', async () => {
  stream.mockReturnValue({ output: Promise.resolve({ changed: false, question: 'different' }) });
  expect(await rewriteFollowUpQuestion('¿Qué documentos actualicé esta semana?', [{ role: 'assistant', content: 'Product Builder' }], 'test', signal)).toBe('¿Qué documentos actualicé esta semana?');
 });
 it('resolves decisions without replacing the original question in the input', async () => {
  stream.mockReturnValue({ output: Promise.resolve({ changed: true, question: '¿Qué decidí sobre Product Builder?' }) });
  expect(await rewriteFollowUpQuestion('¿y de eso qué decidí?', [{ role: 'assistant', content: 'El documento Product Builder describe el proyecto.' }], 'test', signal)).toBe('¿Qué decidí sobre Product Builder?');
  expect(JSON.parse(stream.mock.calls[0]?.[0].prompt).question).toBe('¿y de eso qué decidí?');
 });
 it('rejects an empty rewrite rather than searching without a question', async () => {
  stream.mockReturnValue({ output: Promise.resolve({ changed: true, question: ' ' }) });
  await expect(rewriteFollowUpQuestion('¿y de eso?', [{ role: 'user', content: 'Product Builder' }], 'test', signal)).rejects.toThrow();
 });
});