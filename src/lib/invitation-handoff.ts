export const INVITATION_KEY = 'second-brain:registration-invitation';
export const INVITATION_TTL = 60 * 60 * 1000;
type SavedInvitation = { code: string; expiresAt: number };

export function saveInvitation(storage: Storage, code: string, now = Date.now()) {
 if (!code.trim()) { storage.removeItem(INVITATION_KEY); return; }
 storage.setItem(INVITATION_KEY, JSON.stringify({ code: code.toUpperCase(), expiresAt: now + INVITATION_TTL }));
}

export function readInvitation(storage: Storage, now = Date.now()): SavedInvitation | null {
 const raw = storage.getItem(INVITATION_KEY);
 if (!raw) return null;
 try {
  const saved: unknown = JSON.parse(raw);
  if (typeof saved === 'object' && saved !== null && 'code' in saved && typeof saved.code === 'string' && 'expiresAt' in saved && typeof saved.expiresAt === 'number' && Number.isFinite(saved.expiresAt) && saved.expiresAt > now) return { code: saved.code, expiresAt: saved.expiresAt };
 } catch { /* Discard malformed or expired browser state, never validate the code here. */ }
 storage.removeItem(INVITATION_KEY);
 return null;
}

/** Single flight per browser tab; consume before calling so failed requests are never retried automatically. */
export function createInvitationHandoff(deps: {
 storage: () => Storage;
 authenticated: () => Promise<boolean>;
 redeem: (code: string) => Promise<boolean>;
 failed: () => void;
}) {
 let inFlight: Promise<void> | undefined;
 return function complete(): Promise<void> {
  if (inFlight) return inFlight;
  const storage = deps.storage();
  if (!readInvitation(storage)) return Promise.resolve();
  inFlight = (async () => {
   if (!await deps.authenticated()) return;
   const consume = async () => {
    const saved = readInvitation(storage);
    if (!saved) return;
    storage.removeItem(INVITATION_KEY);
    try { if (!await deps.redeem(saved.code)) deps.failed(); }
    catch { deps.failed(); }
   };
   // A second tab must not redeem the same stored invitation during email confirmation.
   if (typeof navigator !== 'undefined' && navigator.locks) await navigator.locks.request(INVITATION_KEY, consume);
   else await consume();
  })().finally(() => { inFlight = undefined; });
  return inFlight;
 };
}