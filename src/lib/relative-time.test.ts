import { describe, expect, it } from 'vitest';
import { timeAgo } from './relative-time';
const now = Date.parse('2026-11-18T20:00:00Z');
describe('timeAgo', () => {
 it('minutos', () => expect(timeAgo('2026-11-18T19:55:00Z', now)).toBe('hace 5 minutos'));
 it('horas', () => expect(timeAgo('2026-11-18T18:00:00Z', now)).toBe('hace 2 horas'));
 it('nunca', () => expect(timeAgo(null, now)).toBe('Nunca'));
});
