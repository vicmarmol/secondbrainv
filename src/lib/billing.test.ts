import { describe, expect, it } from 'vitest';
import { MONTHLY_PRICE_CENTS, TRIAL_DAYS, paidAccess, trialAccess } from './billing';
describe('Billing rules', () => {
 it('charges 5 euros monthly', () => expect(MONTHLY_PRICE_CENTS).toBe(500));
 it('offers exactly seven days and denies access at expiry', () => {
  expect(TRIAL_DAYS).toBe(7);
  const start = Date.parse('2026-11-14T12:00:00Z');
  const end = new Date(start + TRIAL_DAYS * 86400000).toISOString();
  expect(end).toBe('2026-11-21T12:00:00.000Z');
  expect(trialAccess(end, start + 7 * 86400000 - 1)).toBe(true);
  expect(trialAccess(end, start + 7 * 86400000)).toBe(false);
 });
 it('requires a paid subscription after trial', () => {
  const now = Date.parse('2026-11-22T12:00:00Z');
  const sub = { price_id: 'second_brain_monthly', status: 'active', current_period_end: '2026-12-22T12:00:00Z' };
  expect(paidAccess(sub, now)).toBe(true);
  for (const status of ['incomplete','unpaid','paused','canceled','trialing']) expect(paidAccess({ ...sub, status }, now)).toBe(false);
  expect(paidAccess({ ...sub, current_period_end: '2026-11-22T12:00:00Z' }, now)).toBe(false);
 });
});