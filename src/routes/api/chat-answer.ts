import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/api/chat-answer')({ server: { handlers: { POST: async ({ request }) => { const { handleChatAnswer } = await import('@/lib/chat-answer.server'); return handleChatAnswer(request); } } } });
