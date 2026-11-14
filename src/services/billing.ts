import { getBillingState, startSubscriptionCheckout, confirmSubscriptionCheckout, openBillingPortal } from '@/lib/billing.functions';
import { paymentEnvironment } from '@/lib/billing';
export async function getBilling() {
 let environment: 'sandbox' | 'live' = 'live';
 try { environment = paymentEnvironment(); } catch { /* Access remains readable before live payments are configured. */ }
 return getBillingState({ data: { environment } });
}
export async function beginCheckout() {
 const result = await startSubscriptionCheckout({ data: { environment: paymentEnvironment() } });
 if ('error' in result) throw new Error(result.error);
 return result.clientSecret;
}
export async function confirmCheckout(sessionId: string) {
 const result = await confirmSubscriptionCheckout({ data: { environment: paymentEnvironment(), sessionId } });
 if ('error' in result) throw new Error(result.error);
 return result;
}
export async function billingPortal() {
 const result = await openBillingPortal({ data: { environment: paymentEnvironment() } });
 if ('error' in result) throw new Error(result.error);
 return result.url;
}