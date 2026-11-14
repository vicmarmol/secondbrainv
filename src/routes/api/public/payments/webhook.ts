import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/api/public/payments/webhook')({ server: { handlers: { POST: async ({ request }) => {
 const env = new URL(request.url).searchParams.get('env');
 if (env !== 'sandbox' && env !== 'live') return new Response('Invalid environment', { status: 400 });
 const { verifyWebhook, createStripeClient } = await import('@/lib/stripe.server');
 let event;
 try { event = await verifyWebhook(request, env); } catch { return new Response('Invalid webhook signature', { status: 400 }); }
 if (event.livemode !== (env === 'live')) return new Response('Wrong environment', { status: 400 });
 try {
  const stripe = createStripeClient(env);
  let subscriptionId: string | undefined;
  if (event.type.startsWith('customer.subscription.')) subscriptionId = (event.data.object as { id: string }).id;
  if (event.type.startsWith('checkout.session.')) {
   const session = event.data.object as import('stripe').default.Checkout.Session;
   subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  }
  if (event.type.startsWith('invoice.')) {
   const invoice = event.data.object as import('stripe').default.Invoice;
   const sub = invoice.parent?.subscription_details?.subscription;
   subscriptionId = typeof sub === 'string' ? sub : sub?.id;
  }
  if (subscriptionId) {
   // Re-read authoritative state: duplicate and out-of-order events cannot restore old access.
   const subscription = await stripe.subscriptions.retrieve(subscriptionId);
   const { syncSubscription } = await import('@/lib/billing.server');
   await syncSubscription(subscription, env);
  }
  return Response.json({ received: true });
 } catch { return new Response('Webhook processing failed', { status: 500 }); }
} } } });