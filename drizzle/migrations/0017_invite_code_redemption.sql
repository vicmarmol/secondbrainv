CREATE TABLE public.invite_code_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 attempted_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.invite_code_attempts TO service_role;
ALTER TABLE public.invite_code_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX invite_code_attempts_user_time ON public.invite_code_attempts(user_id,attempted_at);
CREATE OR REPLACE FUNCTION public.apply_pending_approval(target_user uuid, decision public.approval_status, decision_time timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.user_approvals SET status=decision,decided_at=decision_time,approved_at=CASE WHEN decision='aprobado' THEN decision_time ELSE NULL END WHERE user_id=target_user AND status='pendiente';
 IF NOT FOUND THEN RAISE EXCEPTION 'Request is no longer pending'; END IF;
 IF decision='aprobado' THEN
  INSERT INTO public.app_trials(user_id,started_at,ends_at) VALUES(target_user,decision_time,decision_time+interval '7 days')
  ON CONFLICT(user_id) DO UPDATE SET started_at=excluded.started_at,ends_at=excluded.ends_at;
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_pending_approval(uuid,public.approval_status,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.decide_user_approval(target_user uuid, decision public.approval_status) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE approval public.user_approvals; decision_time timestamptz := now();
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF decision NOT IN ('aprobado','rechazado') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=target_user AND role='admin') THEN RAISE EXCEPTION 'Cannot change admin approval'; END IF;
 SELECT * INTO approval FROM public.user_approvals WHERE user_id=target_user FOR UPDATE;
 IF NOT FOUND OR approval.status<>'pendiente' THEN RAISE EXCEPTION 'Request is no longer pending'; END IF;
 PERFORM public.apply_pending_approval(target_user,decision,decision_time);
END;
$$;
REVOKE ALL ON FUNCTION public.decide_user_approval(uuid,public.approval_status) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decide_user_approval(uuid,public.approval_status) TO authenticated;
CREATE OR REPLACE FUNCTION public.redeem_invite_code(code text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE owner uuid := auth.uid(); approval public.user_approvals; invite public.invite_codes; normalized text; failures integer; used_time timestamptz;
BEGIN
 IF owner IS NULL THEN RAISE EXCEPTION 'Código no válido'; END IF;
 -- Lock the user row first: parallel redemptions and manual decisions cannot reset trials or double count.
 SELECT * INTO approval FROM public.user_approvals WHERE user_id=owner FOR UPDATE;
 IF approval.status='aprobado' THEN RETURN jsonb_build_object('ok',true); END IF;
 used_time := clock_timestamp();
 SELECT count(*) INTO failures FROM public.invite_code_attempts WHERE user_id=owner AND attempted_at > used_time-interval '1 hour';
 IF failures>=5 THEN RETURN jsonb_build_object('ok',false,'error','Demasiados intentos. Inténtalo más tarde.'); END IF;
 normalized := regexp_replace(upper(coalesce(code,'')), '[-[:space:]]', '', 'g');
 -- Same lock as generation/deactivation keeps validity and accounting atomic.
 PERFORM pg_advisory_xact_lock(72819,1);
 SELECT * INTO invite FROM public.invite_codes c WHERE c.code=normalized AND c.active FOR UPDATE;
 IF invite.id IS NULL OR approval.user_id IS NULL OR approval.status<>'pendiente' OR public.has_role(owner,'admin') THEN
  INSERT INTO public.invite_code_attempts(user_id,attempted_at) VALUES(owner,used_time);
  RETURN jsonb_build_object('ok',false,'error','Código no válido');
 END IF;
 PERFORM public.apply_pending_approval(owner,'aprobado',used_time);
 UPDATE public.invite_codes SET uses=uses+1 WHERE id=invite.id;
 INSERT INTO public.invite_code_uses(invite_code_id,user_id,used_at) VALUES(invite.id,owner,used_time);
 RETURN jsonb_build_object('ok',true);
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_invite_code(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text) TO authenticated;
COMMENT ON TABLE public.invite_code_attempts IS 'Server-only rolling-hour failed invitation attempts; never stores submitted codes.';