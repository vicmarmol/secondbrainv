import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInvitationHandoff, INVITATION_KEY, readInvitation, saveInvitation } from './invitation-handoff';

describe('Registration invitation handoff', () => {
 beforeEach(() => localStorage.clear());
 it('expires exactly one hour after saving, not when reopening the page', () => {
  saveInvitation(localStorage, 'abcd-2345', 1000);
  expect(readInvitation(localStorage, 1000 + 60 * 60 * 1000 - 1)?.code).toBe('ABCD-2345');
  expect(readInvitation(localStorage, 1000 + 60 * 60 * 1000)).toBeNull();
  expect(localStorage.getItem(INVITATION_KEY)).toBeNull();
 });
 it('stores uppercase without validating, stripping, or rejecting the entered code', () => {
  saveInvitation(localStorage, ' wrong code ', 1000);
  expect(readInvitation(localStorage, 1000)?.code).toBe(' WRONG CODE ');
 });
 it('clears a previous code when signup proceeds without one', () => {
  saveInvitation(localStorage, 'ABCD2345'); saveInvitation(localStorage, ' ');
  expect(readInvitation(localStorage)).toBeNull();
 });
 it('keeps the code across page reloads while waiting for email confirmation', async () => {
  saveInvitation(localStorage, 'ABCD2345');
  const redeem = vi.fn(async () => true);
  await createInvitationHandoff({ storage: () => localStorage, authenticated: async () => false, redeem, failed: vi.fn() })();
  expect(readInvitation(localStorage)?.code).toBe('ABCD2345'); expect(redeem).not.toHaveBeenCalled();
 });
 it('redeems once after authentication and removes the code before the RPC, even with concurrent access checks', async () => {
  saveInvitation(localStorage, 'ABCD2345');
  const redeem = vi.fn(async () => { expect(localStorage.getItem(INVITATION_KEY)).toBeNull(); return true; });
  const failed = vi.fn();
  const complete = createInvitationHandoff({ storage: () => localStorage, authenticated: async () => true, redeem, failed });
  await Promise.all([complete(), complete(), complete()]); await complete();
  expect(redeem).toHaveBeenCalledTimes(1); expect(redeem).toHaveBeenCalledWith('ABCD2345'); expect(failed).not.toHaveBeenCalled();
 });
 it.each(['Código no válido', 'Demasiados intentos. Inténtalo más tarde.'])('shows the waiting notice on server failure: %s', async () => {
  saveInvitation(localStorage, 'ABCD2345'); const failed = vi.fn(); const redeem = vi.fn(async () => false);
  const complete = createInvitationHandoff({ storage: () => localStorage, authenticated: async () => true, redeem, failed });
  await complete(); await complete();
  expect(failed).toHaveBeenCalledTimes(1); expect(redeem).toHaveBeenCalledTimes(1); expect(readInvitation(localStorage)).toBeNull();
 });
 it('does not automatically retry network failures', async () => {
  saveInvitation(localStorage, 'ABCD2345'); const failed = vi.fn(); const redeem = vi.fn(async (): Promise<boolean> => { throw new TypeError('network'); });
  const complete = createInvitationHandoff({ storage: () => localStorage, authenticated: async () => true, redeem, failed });
  await complete(); await complete(); expect(redeem).toHaveBeenCalledTimes(1); expect(failed).toHaveBeenCalledOnce();
 });
 it('does not call auth or redemption without a saved code', async () => {
  const authenticated = vi.fn(async () => true); const redeem = vi.fn(async () => true);
  await createInvitationHandoff({ storage: () => localStorage, authenticated, redeem, failed: vi.fn() })();
  expect(authenticated).not.toHaveBeenCalled(); expect(redeem).not.toHaveBeenCalled();
 });
});