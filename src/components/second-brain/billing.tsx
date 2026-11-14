import { useEffect, useState } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Brain, CreditCard, ArrowLeft, ExternalLink } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { getBilling, beginCheckout, confirmCheckout, billingPortal } from '@/services/billing';
import { paidAccess } from '@/lib/billing';
import { toast } from 'sonner';
let stripePromise: ReturnType<typeof loadStripe> | undefined;
function stripeClient() {
 const token = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'];
 if (!token || (!token.startsWith('pk_test_') && !token.startsWith('pk_live_'))) throw new Error('Los pagos reales todavía no están activados.');
 stripePromise ??= loadStripe(token);
 return stripePromise;
}
export function BillingView() {
 const router = useRouter();
 const query = useQuery({ queryKey: ['billing'], queryFn: getBilling, refetchInterval: 10000 });
 const [clientSecret, setClientSecret] = useState<string | null>(null);
 const [busy, setBusy] = useState(false);
 const [paymentPending, setPaymentPending] = useState(false);
 const token = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'];
 const paid = query.data?.subscriptions.find(sub => paidAccess(sub));
 useEffect(() => {
  const session = new URLSearchParams(window.location.search).get('session_id');
  if (!session) return;
  confirmCheckout(session).then(result => { setPaymentPending(result.pending); query.refetch(); router.invalidate(); }).catch(e => toast.error(e.message));
 }, []);
 async function checkout() {
  setBusy(true);
  try { stripeClient(); setClientSecret(await beginCheckout()); } catch (e) { toast.error((e as Error).message); }
  finally { setBusy(false); }
 }
 async function portal() {
  setBusy(true);
  const tab = window.open('about:blank', '_blank');
  try { const url = await billingPortal(); if (tab) { tab.opener = null; tab.location.href = url; } else toast.error('Permite abrir ventanas para gestionar tu suscripción.'); }
  catch (e) { tab?.close(); toast.error((e as Error).message); } finally { setBusy(false); }
 }
 return <div className="w-full overflow-y-auto">
  {token?.startsWith('pk_test_') ? <div className="border-b border-border bg-warning-surface px-4 py-3 text-center text-sm text-warning">Pagos de prueba · No se cobra dinero real.</div> : !token ? <div className="border-b border-border bg-warning-surface px-4 py-3 text-center text-sm text-warning">Los pagos reales todavía no están activados.</div> : null}
  <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
   <div className="mb-8 flex items-center gap-3 text-primary"><Brain size={24}/><span className="text-xl font-semibold">Second Brain</span></div>
   <h1 className="text-2xl font-semibold">Tu suscripción</h1>
   {query.isPending ? <p className="mt-4 text-muted-foreground">Comprobando tu acceso…</p> : query.error ? <div className="mt-4"><p role="alert">{query.error.message}</p><Button className="mt-4" onClick={() => query.refetch()}>Reintentar</Button></div> : <>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{paid ? `Suscripción activa hasta el ${new Date(paid.current_period_end ?? '').toLocaleDateString('es-ES')}.` : query.data?.hasAccess ? `Tu prueba gratuita termina el ${new Date(query.data.trial.ends_at).toLocaleDateString('es-ES')}. No necesitas tarjeta.` : 'Tu prueba de 7 días ha terminado. Suscríbete para seguir utilizando tu espacio. Tus documentos se conservan.'}</p>
    {paid?.cancel_at_period_end && <p className="mt-3 text-sm text-warning">Cancelada la renovación. Mantienes el acceso hasta la fecha indicada.</p>}
    {paid?.status === 'past_due' && <p className="mt-3 text-sm text-warning">Hay un cobro pendiente. Actualiza tu método de pago para evitar la interrupción del acceso.</p>}
    {paymentPending && <p className="mt-3 text-sm text-warning">Tu pago está pendiente de confirmación.</p>}
    <section className="mt-8 border-y border-border py-7">
     <h2 className="text-lg font-medium">Second Brain</h2><div className="mt-3 flex items-baseline gap-2"><span className="text-4xl font-semibold">5 €</span><span className="text-muted-foreground">/ mes</span></div>
     <p className="mt-3 text-sm text-muted-foreground">Chat, biblioteca y conexiones en tu espacio personal.</p>
     <p className="mt-2 text-xs text-muted-foreground">Impuestos incluidos. Renovación mensual. Puedes cancelar antes del siguiente cobro.</p>
     <div className="mt-6 flex flex-wrap gap-3">{paid || query.data?.subscriptions.length ? <Button onClick={portal} disabled={busy}><ExternalLink/>Gestionar suscripción</Button> : <Button onClick={checkout} disabled={busy || !!clientSecret || !token}><CreditCard/>{busy ? 'Abriendo pago…' : 'Suscribirme'}</Button>}
      {query.data?.subscriptions.length && !paid ? <Button variant="outline" disabled={busy || !!clientSecret || !token} onClick={checkout}><CreditCard/>Reactivar suscripción</Button> : null}
      {query.data?.hasAccess && <Button variant="outline" asChild><Link to="/"><ArrowLeft/>Volver al chat</Link></Button>}
     </div>
    </section>
   </>}
   {clientSecret && <div className="mt-8"><EmbeddedCheckoutProvider stripe={stripeClient()} options={{ clientSecret }}><EmbeddedCheckout/></EmbeddedCheckoutProvider></div>}
  </div>
 </div>;
}
