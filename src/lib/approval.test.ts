import { describe, expect, it } from 'vitest';
import { approvalAllowsAccess } from './approval';
import { TRIAL_DAYS } from './billing';
describe('approval access rules', () => {
 it('pending users are blocked', () => { expect(approvalAllowsAccess(false, 'pendiente')).toBe(false); });
 it('rejected users are blocked', () => { expect(approvalAllowsAccess(false, 'rechazado')).toBe(false); });
 it('approved users pass the approval gate', () => { expect(approvalAllowsAccess(false, 'aprobado')).toBe(true); });
 it('admins always pass even if approval is missing', () => { expect(approvalAllowsAccess(true, null)).toBe(true); });
 it('approval starts a seven-day trial', () => { expect(TRIAL_DAYS).toBe(7); });
});