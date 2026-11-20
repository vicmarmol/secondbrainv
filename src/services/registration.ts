import { supabase } from '@/integrations/supabase/client';
import { createInvitationHandoff, INVITATION_KEY, readInvitation, saveInvitation } from '@/lib/invitation-handoff';

let invitationFailed = false;
const listeners = new Set<() => void>();
export const subscribeInvitationNotice = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getInvitationNotice = () => invitationFailed;
export const getServerInvitationNotice = () => false;
export function clearInvitationNotice() { invitationFailed = false; listeners.forEach(listener => listener()); }
export function storeRegistrationInvitation(code: string) { clearInvitationNotice(); saveInvitation(window.localStorage, code); }
export function discardRegistrationInvitation() { window.localStorage.removeItem(INVITATION_KEY); }
export function getRegistrationInvitation() { return readInvitation(window.localStorage)?.code ?? ''; }

const complete = createInvitationHandoff({
 storage: () => window.localStorage,
 authenticated: async () => { const { data, error } = await supabase.auth.getUser(); return !error && Boolean(data.user); },
 redeem: async code => {
  const { data, error } = await supabase.rpc('redeem_invite_code', { code });
  return !error && typeof data === 'object' && data !== null && !Array.isArray(data) && data['ok'] === true;
 },
 failed: () => { invitationFailed = true; listeners.forEach(listener => listener()); },
});

/** Await before the existing access check, including Google/email redirects and later login. */
export async function completeRegistrationInvitation() {
 if (typeof window === 'undefined') return;
 await complete();
}