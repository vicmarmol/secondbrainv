import { supabase } from '@/integrations/supabase/client';
export async function sendMessage(conversationId: string, message: string, messageId: string, onText?: (text: string) => void) {
 const { data } = await supabase.auth.getSession();
 if (!data.session) throw new Error('Inicia sesión para preguntar a tus documentos.');
 const response = await fetch('/api/chat-answer', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ conversationId, message, messageId }) });
 if (!response.ok) { const body = await response.json(); throw new Error(body.error ?? 'No se ha podido responder.'); }
 if (!response.body) throw new Error('No se ha recibido una respuesta.');
 const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let done = false;
 while (true) { const chunk = await reader.read(); if (chunk.done) break; buffer += decoder.decode(chunk.value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() ?? ''; for (const line of lines) { if (!line.trim()) continue; const event = JSON.parse(line); if (event.type === 'error') throw new Error(event.error); if (event.type === 'text') onText?.(event.text); if (event.type === 'done') done = true; } }
 if (!done) throw new Error('La respuesta se interrumpió. No se ha guardado una respuesta vacía.');
}
