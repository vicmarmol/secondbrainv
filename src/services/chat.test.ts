import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { groupFor } from './chat';
describe('Conversation groups in Europe/Madrid', () => {
 const now = new Date('2026-11-13T18:49:00Z');
 it('00:30 Madrid today (23:30 UTC yesterday) is Hoy', () => expect(groupFor('2026-11-12T23:30:00Z', now)).toBe('Hoy'));
 it('22:30 UTC yesterday is Ayer', () => expect(groupFor('2026-11-12T22:30:00Z', now)).toBe('Ayer'));
 it('two days ago is Anteriores', () => expect(groupFor('2026-11-11T10:00:00Z', now)).toBe('Anteriores'));
});
