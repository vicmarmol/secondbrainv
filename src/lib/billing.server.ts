import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { createStripeClient, type StripeEnv } from './stripe.server';
export async function requireAppAccess(db: SupabaseClient<Database>) {
 const { data, error } = await db.rpc('has_app_access');
 if (error || !data) throw new Error('Tu prueba ha terminado. Activa la suscripción para continuar.');
}
export async function syncSubscription(subscription: Stripe.Subscription, env: StripeEnv) {
 const userId = subscription.metadata.userId;
 const item = subscription.items.data[0];
 if (!userId || !/^[0-9a-f-]{36}$/i.test(userId) || !item) throw new Error('Missing subscription owner');
 const stripe = createStripeClient(env);
 const price = await stripe.prices.retrieve(item.price.id);
 const plan = price.lookup_key ?? price.metadata.lovable_external_id;
 if (plan !== 'second_brain_monthly') return;
 const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
 const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
 if (userError || !user.user) throw new Error('Unknown subscription owner');
 const { error } = await supabaseAdmin.from('subscriptions').upsert({
  user_id: userId, stripe_subscription_id: subscription.id,
  stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
  product_id: typeof price.product === 'string' ? price.product : price.product.id,
  price_id: plan, status: subscription.status, environment: env,
  current_period_start: new Date(item.current_period_start * 1000).toISOString(),
  current_period_end: new Date(item.current_period_end * 1000).toISOString(),
  cancel_at_period_end: subscription.cancel_at_period_end,
  updated_at: new Date().toISOString(),
 }, { onConflict: 'environment,stripe_subscription_id' });
 if (error) throw error;
}