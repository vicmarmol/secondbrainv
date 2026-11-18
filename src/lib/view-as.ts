import { useSyncExternalStore } from 'react';
// Admin-only visual preview. Lives only in memory: never persisted, cleared on sign-out.
export type ViewAs = null | { kind: 'trial'; days: 1 | 3 | 7 } | { kind: 'expired' };
let current: ViewAs = null;
const listeners = new Set<() => void>();
export function setViewAs(next: ViewAs) { current = next; listeners.forEach(l => l()); }
export function useViewAs() { return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => current, () => null); }
export function viewAsLabel(v: ViewAs) { return !v ? 'Admin (mi vista normal)' : v.kind === 'expired' ? 'Usuario con prueba vencida' : `Usuario en prueba (${v.days} ${v.days === 1 ? 'día restante' : 'días restantes'})`; }
type Billing = { trial: { ends_at: string } & Record<string, unknown>; subscriptions: unknown[]; hasAccess: boolean; freeAccess: boolean; serverNow: string };
/** Simulated billing for presentation only; preview applies only when the real server state is admin. */
export function applyViewAs<T extends Billing>(real: T, v: ViewAs, now = Date.now()): T {
 if (!v || !real.freeAccess) return real;
 const day = 86_400_000;
 const endsAt = v.kind === 'trial' ? now + v.days * day : now - day;
 return { ...real, freeAccess: false, hasAccess: v.kind === 'trial', subscriptions: [], trial: { ...real.trial, ends_at: new Date(endsAt).toISOString() } };
}
