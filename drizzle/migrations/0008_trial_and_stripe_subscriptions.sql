CREATE TABLE public.app_trials (
 user_id uuid PRIMARY KEY DEFAULT auth.uid(),
 started_at timestamptz NOT NULL DEFAULT now(),
 ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
 CHECK (ends_at = started_at + interval '7 days')
);
GRANT SELECT ON public.app_trials TO authenticated;
GRANT ALL ON public.app_trials TO service_role;
ALTER TABLE public.app_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own trial" ON public.app_trials FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE TABLE public.subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
 stripe_subscription_id text NOT NULL, stripe_customer_id text NOT NULL,
 product_id text NOT NULL, price_id text NOT NULL, status text NOT NULL,
 current_period_start timestamptz, current_period_end timestamptz,
 cancel_at_period_end boolean NOT NULL DEFAULT false,
 environment text NOT NULL CHECK(environment IN ('sandbox','live')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(environment,stripe_subscription_id)
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own subscription" ON public.subscriptions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE INDEX subscriptions_user_environment ON public.subscriptions(user_id,environment);
CREATE FUNCTION public.ensure_app_trial() RETURNS public.app_trials LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.app_trials;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 INSERT INTO public.app_trials(user_id) VALUES(auth.uid()) ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO result FROM public.app_trials WHERE user_id=auth.uid();
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.ensure_app_trial() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ensure_app_trial() TO authenticated;
CREATE FUNCTION public.has_app_access() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND (
 EXISTS(SELECT 1 FROM public.app_trials WHERE user_id=auth.uid() AND ends_at>now())
 OR EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=auth.uid() AND environment='live'
 AND price_id='second_brain_monthly' AND current_period_end>now()
 AND status IN ('active','past_due'))
 );
$$;
REVOKE ALL ON FUNCTION public.has_app_access() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_app_access() TO authenticated;
CREATE POLICY "Require trial or payment" ON public.documents AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());
CREATE POLICY "Require trial or payment" ON public.conversations AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());
CREATE POLICY "Require trial or payment" ON public.messages AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());
CREATE POLICY "Require trial or payment" ON public.connections AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());
CREATE POLICY "Require trial or payment" ON public.sync_runs AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_app_access()) WITH CHECK(public.has_app_access());