CREATE TABLE public.invite_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 code text NOT NULL UNIQUE CHECK (code ~ '^[A-HJ-KM-NP-Z2-9]{8}$'),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.invite_codes TO authenticated;
GRANT ALL ON public.invite_codes TO service_role;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages invite codes" ON public.invite_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE UNIQUE INDEX invite_codes_one_active ON public.invite_codes ((active)) WHERE active;
CREATE TABLE public.invite_code_uses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 invite_code_id uuid NOT NULL REFERENCES public.invite_codes(id),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 used_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id)
);
GRANT SELECT ON public.invite_code_uses TO authenticated;
GRANT ALL ON public.invite_code_uses TO service_role;
ALTER TABLE public.invite_code_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads invite uses" ON public.invite_code_uses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.manage_invite_code(action text, expected_active_id uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_id uuid; alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; generated text; bytes bytea; i integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF action NOT IN ('generate','deactivate') OR action IS NULL THEN RAISE EXCEPTION 'Invalid action'; END IF;
 PERFORM pg_advisory_xact_lock(72819, 1);
 SELECT id INTO current_id FROM public.invite_codes WHERE active FOR UPDATE;
 IF current_id IS DISTINCT FROM expected_active_id THEN RAISE EXCEPTION 'El código ha cambiado. Actualiza el panel y vuelve a intentarlo.'; END IF;
 UPDATE public.invite_codes SET active=false WHERE active;
 IF action='generate' THEN
  LOOP
   generated := ''; bytes := extensions.gen_random_bytes(8);
   FOR i IN 0..7 LOOP generated := generated || substr(alphabet, (get_byte(bytes,i) % length(alphabet))+1,1); END LOOP;
   EXIT WHEN NOT EXISTS(SELECT 1 FROM public.invite_codes WHERE code=generated);
  END LOOP;
  INSERT INTO public.invite_codes(code) VALUES(generated);
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.manage_invite_code(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_invite_code(text,uuid) TO authenticated;