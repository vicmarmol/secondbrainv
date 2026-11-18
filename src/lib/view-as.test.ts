import { describe, it, expect } from 'vitest';
import { applyViewAs } from './view-as';
const now = Date.parse('2026-11-18T12:00:00Z');
const admin = { trial: { ends_at: '2026-11-21T12:00:00Z' }, subscriptions: [], hasAccess: true, freeAccess: true, serverNow: '' };
describe('ver como', () => {
 it('trial with 3 days ends 3 days from now and keeps access', () => { const r = applyViewAs(admin, { kind: 'trial', days: 3 }, now); expect(r.trial.ends_at).toBe('2026-11-21T12:00:00.000Z'); expect(r.hasAccess).toBe(true); expect(r.freeAccess).toBe(false); });
 it('expired trial blocks access', () => { expect(applyViewAs(admin, { kind: 'expired' }, now).hasAccess).toBe(false); });
 it('a non-admin cannot activate a preview', () => { const user = { ...admin, freeAccess: false, hasAccess: false }; expect(applyViewAs(user, { kind: 'trial', days: 7 }, now)).toBe(user); });
});
