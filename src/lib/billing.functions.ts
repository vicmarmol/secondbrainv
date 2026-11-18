import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
const envSchema = z.object({ environment: z.enum(['sandbox', 'live']) });
export const getBillingState = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(envSchema).handler(async ({ context, data }) => {
 const trial = await context.supabase.rpc('ensure_app_trial');
 if (trial.error) throw new Error('No se ha podido comprobar tu prueba gratuita.');
 const subscriptions = await context.supabase.from('subscriptions').select('*').eq('user_id', context.userId).eq('environment', data.environment).order('created_at', { ascending: false });
 const access = await context.supabase.rpc('has_app_access');
 const freeAccess = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
 if (subscriptions.error || access.error || freeAccess.error) throw new Error('No se ha podido comprobar tu suscripción.');
 return { trial: trial.data, subscriptions: subscriptions.data, hasAccess: access.data, freeAccess: freeAccess.data, serverNow: new Date().toISOString() };
});
async function resolveOrCreateCustomer(
 stripe: ReturnType<(typeof import('./stripe.server'))['createStripeClient']>,
 options: { email?: string; userId?: string },
): Promise<string> {
 if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error('Invalid userId');
 if (options.userId) {
  const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
  const first = found.data[0]; if (first) return first.id;
 }
 if (options.email) {
  const existing = await stripe.customers.list({ email: options.email, limit: 1 });
  const customer = existing.data[0];
  if (customer) {
   if (options.userId && customer.metadata?.['userId'] !== options.userId) await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
   return customer.id;
  }
 }
 const created = await stripe.customers.create({ ...(options.email && { email: options.email }), ...(options.userId && { metadata: { userId: options.userId } }) });
 return created.id;
}
export const startSubscriptionCheckout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(envSchema).handler(async ({ context, data }) => {
 const { createStripeClient, getStripeErrorMessage } = await import('./stripe.server');
 try {
  const freeAccess = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (freeAccess.error) throw new Error('No se ha podido comprobar tu acceso.');
  if (freeAccess.data) return { error: 'Tu cuenta tiene acceso gratuito y no necesita suscripción.' };
  const stripe = createStripeClient(data.environment);
  const { data: auth, error } = await context.supabase.auth.getUser();
  if (error || !auth.user) throw new Error('Inicia sesión de nuevo.');
  const customer = await resolveOrCreateCustomer(stripe, { userId: context.userId, ...(auth.user.email ? { email: auth.user.email } : {}) });
  const existing = await stripe.subscriptions.list({ customer, status: 'all', limit: 100 });
  if (existing.data.some(sub => ['active','trialing','past_due','incomplete'].includes(sub.status))) throw new Error('Ya tienes una suscripción o un pago pendiente. Gestiona tu suscripción en lugar de pagar otra vez.');
  const prices = await stripe.prices.list({ lookup_keys: ['second_brain_monthly'], active: true, limit: 1 });
  let price = prices.data[0];
  if (!price || price.unit_amount !== 500 || price.currency !== 'eur' || price.recurring?.interval !== 'month') throw new Error('El precio mensual no está configurado correctamente.');
  if (price.tax_behavior !== 'inclusive') {
   const productId = typeof price.product === 'string' ? price.product : price.product.id;
   price = await stripe.prices.create({ product: productId, unit_amount: 500, currency: 'eur', recurring: { interval: 'month' }, tax_behavior: 'inclusive', lookup_key: 'second_brain_monthly', transfer_lookup_key: true, metadata: { lovable_external_id: 'second_brain_monthly' } }, { idempotencyKey: `second_brain_monthly_inclusive_${data.environment}` });
  }
  const origin = new URL(getRequest().url).origin;
  const session = await stripe.checkout.sessions.create({
   customer, line_items: [{ price: price.id, quantity: 1 }], mode: 'subscription',
   ui_mode: 'embedded_page', return_url: `${origin}/suscripcion?session_id={CHECKOUT_SESSION_ID}`,
   locale: 'es', metadata: { userId: context.userId }, subscription_data: { metadata: { userId: context.userId } },
   managed_payments: { enabled: true },
  } as Parameters<typeof stripe.checkout.sessions.create>[0]);
  if (!session.client_secret) throw new Error('No se ha podido abrir el pago.');
  return { clientSecret: session.client_secret };
 } catch (error) { return { error: getStripeErrorMessage(error) }; }
});
export const confirmSubscriptionCheckout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(envSchema.extend({ sessionId: z.string().regex(/^cs_[a-zA-Z0-9_]+$/).max(255) })).handler(async ({ context, data }) => {
 const { createStripeClient, getStripeErrorMessage } = await import('./stripe.server');
 try {
  const stripe = createStripeClient(data.environment);
  const session = await stripe.checkout.sessions.retrieve(data.sessionId);
  if (session.metadata?.['userId'] !== context.userId) throw new Error('Este pago no pertenece a tu cuenta.');
  if (session.status !== 'complete' || session.payment_status !== 'paid' || !session.subscription) return { pending: true };
  const subscription = await stripe.subscriptions.retrieve(typeof session.subscription === 'string' ? session.subscription : session.subscription.id);
  if (subscription.metadata['userId'] !== context.userId) throw new Error('Suscripción no válida.');
  const { syncSubscription } = await import('./billing.server');
  await syncSubscription(subscription, data.environment);
  return { pending: false };
 } catch (error) { return { error: getStripeErrorMessage(error) }; }
});
export const openBillingPortal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(envSchema).handler(async ({ context, data }) => {
 const { createStripeClient, getStripeErrorMessage } = await import('./stripe.server');
 try {
  const { data: sub, error } = await context.supabase.from('subscriptions').select('stripe_customer_id').eq('user_id', context.userId).eq('environment', data.environment).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error || !sub) throw new Error('Todavía no tienes una suscripción.');
  const stripe = createStripeClient(data.environment);
  const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${new URL(getRequest().url).origin}/suscripcion` });
  return { url: portal.url };
 } catch (error) { return { error: getStripeErrorMessage(error) }; }
});