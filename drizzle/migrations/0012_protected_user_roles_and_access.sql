CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role public.app_role NOT NULL DEFAULT 'user'
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
INSERT INTO public.user_roles(user_id, role) SELECT id, 'user'::public.app_role FROM auth.users ON CONFLICT(user_id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
 SELECT auth.uid() IS NOT NULL AND _user_id = auth.uid() AND EXISTS (
 SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
 );
$function$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.handle_new_user_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
 INSERT INTO public.user_roles(user_id, role) VALUES(NEW.id, 'user') ON CONFLICT(user_id) DO NOTHING;
 INSERT INTO public.app_trials(user_id, started_at, ends_at) VALUES(NEW.id, NEW.created_at, NEW.created_at + interval '7 days') ON CONFLICT(user_id) DO NOTHING;
 RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.handle_new_user_access() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_access AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_access();
CREATE OR REPLACE FUNCTION public.ensure_app_trial()
RETURNS public.app_trials LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
DECLARE result public.app_trials;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 INSERT INTO public.app_trials(user_id, started_at, ends_at)
 SELECT id, created_at, created_at + interval '7 days' FROM auth.users WHERE id=auth.uid()
 ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO result FROM public.app_trials WHERE user_id=auth.uid();
 RETURN result;
END;
$function$;
REVOKE ALL ON FUNCTION public.ensure_app_trial() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_app_trial() TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.has_app_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
 SELECT auth.uid() IS NOT NULL AND (
 public.has_role(auth.uid(), 'admin')
 OR (public.has_role(auth.uid(), 'user') AND (
 EXISTS(SELECT 1 FROM public.app_trials WHERE user_id=auth.uid() AND ends_at>now())
 OR EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=auth.uid() AND environment='live'
 AND price_id='second_brain_monthly' AND current_period_end>now()
 AND status IN ('active','past_due'))
 )));
$function$;
REVOKE ALL ON FUNCTION public.has_app_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_app_access() TO authenticated, service_role;