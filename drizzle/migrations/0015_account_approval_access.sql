CREATE TYPE public.approval_status AS ENUM ('pendiente','aprobado','rechazado');
CREATE TABLE public.user_approvals (
 user_id uuid PRIMARY KEY DEFAULT auth.uid(),
 status public.approval_status NOT NULL DEFAULT 'pendiente',
 registered_at timestamptz NOT NULL DEFAULT now(),
 approved_at timestamptz,
 decided_at timestamptz
);
GRANT SELECT ON public.user_approvals TO authenticated;
GRANT ALL ON public.user_approvals TO service_role;
ALTER TABLE public.user_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own approval" ON public.user_approvals FOR SELECT TO authenticated USING (user_id=auth.uid());
INSERT INTO public.user_approvals(user_id,status,registered_at,approved_at,decided_at)
 SELECT u.id,'aprobado',u.created_at,coalesce(t.started_at,u.created_at),now()
 FROM auth.users u LEFT JOIN public.app_trials t ON t.user_id=u.id;
CREATE OR REPLACE FUNCTION public.handle_new_user_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'user') ON CONFLICT(user_id) DO NOTHING;
 INSERT INTO public.user_approvals(user_id,status,registered_at) VALUES(NEW.id,'pendiente',NEW.created_at) ON CONFLICT(user_id) DO NOTHING;
 RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.ensure_app_trial() RETURNS public.app_trials LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.app_trials; approved_time timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 SELECT approved_at INTO approved_time FROM public.user_approvals WHERE user_id=auth.uid() AND status='aprobado';
 IF approved_time IS NOT NULL THEN
  INSERT INTO public.app_trials(user_id,started_at,ends_at) VALUES(auth.uid(),approved_time,approved_time+interval '7 days') ON CONFLICT(user_id) DO NOTHING;
 END IF;
 SELECT * INTO result FROM public.app_trials WHERE user_id=auth.uid();
 IF result.user_id IS NULL THEN result := ROW(auth.uid(),now(),now())::public.app_trials; END IF;
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.has_app_access() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND (
 public.has_role(auth.uid(),'admin') OR (
 public.has_role(auth.uid(),'user') AND EXISTS(SELECT 1 FROM public.user_approvals WHERE user_id=auth.uid() AND status='aprobado') AND (
 EXISTS(SELECT 1 FROM public.app_trials WHERE user_id=auth.uid() AND ends_at>now()) OR
 EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=auth.uid() AND environment='live' AND price_id='second_brain_monthly' AND current_period_end>now() AND status IN ('active','past_due')))));
$$;
CREATE OR REPLACE FUNCTION public.decide_user_approval(target_user uuid, decision public.approval_status) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE approval public.user_approvals; decision_time timestamptz := now();
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF decision NOT IN ('aprobado','rechazado') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=target_user AND role='admin') THEN RAISE EXCEPTION 'Cannot change admin approval'; END IF;
 SELECT * INTO approval FROM public.user_approvals WHERE user_id=target_user FOR UPDATE;
 IF NOT FOUND OR approval.status<>'pendiente' THEN RAISE EXCEPTION 'Request is no longer pending'; END IF;
 UPDATE public.user_approvals SET status=decision,decided_at=decision_time,approved_at=CASE WHEN decision='aprobado' THEN decision_time ELSE NULL END WHERE user_id=target_user;
 IF decision='aprobado' THEN
  INSERT INTO public.app_trials(user_id,started_at,ends_at) VALUES(target_user,decision_time,decision_time+interval '7 days')
  ON CONFLICT(user_id) DO UPDATE SET started_at=excluded.started_at,ends_at=excluded.ends_at;
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.decide_user_approval(uuid,public.approval_status) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decide_user_approval(uuid,public.approval_status) TO authenticated;
REVOKE ALL ON FUNCTION public.ensure_app_trial() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ensure_app_trial() TO authenticated;
