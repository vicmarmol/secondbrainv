export const MONTHLY_PRICE_CENTS = 500;
export const TRIAL_DAYS = 7;
export type PaymentEnvironment = 'sandbox' | 'live';
export function paymentEnvironment(): PaymentEnvironment {
 const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
 if (token?.startsWith('pk_test_')) return 'sandbox';
 if (token?.startsWith('pk_live_')) return 'live';
 throw new Error('Los pagos reales todavía no están activados.');
}
export function paidAccess(sub: { status: string; current_period_end: string | null; price_id: string }, now = Date.now()) {
 return sub.price_id === 'second_brain_monthly' && ['active', 'past_due'].includes(sub.status) && sub.current_period_end !== null && Date.parse(sub.current_period_end) > now;
}
export function trialAccess(endsAt: string, now = Date.now()) { return Date.parse(endsAt) > now; }