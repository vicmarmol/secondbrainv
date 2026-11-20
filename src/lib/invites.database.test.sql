-- Run with test.invite_user set to a temporary authenticated user UUID.
-- The exception subtransaction rolls back ALL test writes on success or failure.
DO $tests$
DECLARE
 tester uuid := current_setting('test.invite_user')::uuid;
 admin_id uuid;
 code_id uuid;
 result jsonb;
 trial public.app_trials;
 initial_time timestamptz;
 counter integer;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=tester AND email LIKE 'agent-test+%@example.com') THEN
  RAISE EXCEPTION 'Requires a disposable agent test user';
 END IF;
 SELECT user_id INTO admin_id FROM public.user_roles WHERE role='admin' LIMIT 1;
 BEGIN
  UPDATE public.user_approvals SET status='pendiente', approved_at=NULL, decided_at=NULL WHERE user_id=tester;
  DELETE FROM public.app_trials WHERE user_id=tester;
  DELETE FROM public.invite_code_attempts WHERE user_id=tester;
  DELETE FROM public.invite_code_uses WHERE user_id=tester;
  UPDATE public.invite_codes SET active=false WHERE active;
  INSERT INTO public.invite_codes(user_id,code) VALUES(admin_id,'ABCD2345') RETURNING id INTO code_id;
  INSERT INTO public.invite_code_uses(invite_code_id,user_id) VALUES(code_id,tester);

  -- Rule: at most one active code.
  BEGIN
   INSERT INTO public.invite_codes(user_id,code) VALUES(admin_id,'EFGH6789');
   RAISE EXCEPTION 'Single-active rule failed';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  -- Rule: ambiguous characters and lengths cannot be stored.
  FOREACH result IN ARRAY ARRAY[to_jsonb('ABCD0234'::text),to_jsonb('ABCDO234'::text),to_jsonb('ABCD1234'::text),to_jsonb('ABCDI234'::text),to_jsonb('ABCDL234'::text),to_jsonb('ABC2345'::text)] LOOP
   BEGIN
    INSERT INTO public.invite_codes(user_id,code,active) VALUES(admin_id,result #>> '{}',false);
    RAISE EXCEPTION 'Code format rule failed';
   EXCEPTION WHEN check_violation THEN NULL;
   END;
  END LOOP;
  -- Rule: authentication required.
  PERFORM set_config('request.jwt.claim.sub','',true);
  BEGIN
   PERFORM public.redeem_invite_code('ABCD2345');
   RAISE EXCEPTION 'Authentication rule failed';
  EXCEPTION WHEN raise_exception THEN
   IF SQLERRM <> 'Código no válido' THEN RAISE; END IF;
  END;
  PERFORM set_config('request.jwt.claim.sub',tester::text,true);
  -- Rule: ordinary users cannot read codes/usage or mutate codes; private helper cannot be called.
  PERFORM set_config('role','authenticated',true);
  SELECT count(*) INTO counter FROM public.invite_codes;
  IF counter<>0 THEN RAISE EXCEPTION 'Code isolation failed'; END IF;
  SELECT count(*) INTO counter FROM public.invite_code_uses;
  IF counter<>0 THEN RAISE EXCEPTION 'Usage isolation failed'; END IF;
  BEGIN
   INSERT INTO public.invite_codes(user_id,code,active) VALUES(tester,'EFGH6789',false);
   RAISE EXCEPTION 'User code write rule failed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
   PERFORM public.apply_pending_approval(tester,'aprobado',now());
   RAISE EXCEPTION 'Private approval helper exposed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
   PERFORM public.decide_user_approval(tester,'aprobado');
   RAISE EXCEPTION 'Manual approval allowed a non-admin';
  EXCEPTION WHEN raise_exception THEN
   IF SQLERRM <> 'Admin required' THEN RAISE; END IF;
  END;
  -- Rule: the first five failures are recorded; sixth is blocked even for valid code.
  FOR counter IN 1..5 LOOP
   result := public.redeem_invite_code('ZZZZZZZZ');
   IF result <> '{"ok":false,"error":"Código no válido"}'::jsonb THEN RAISE EXCEPTION 'Generic failure rule failed'; END IF;
  END LOOP;
  result := public.redeem_invite_code('ABCD2345');
  IF result <> '{"ok":false,"error":"Demasiados intentos. Inténtalo más tarde."}'::jsonb THEN RAISE EXCEPTION 'Five failures per hour rule failed'; END IF;
  PERFORM set_config('role','postgres',true);
  DELETE FROM public.invite_code_uses WHERE user_id=tester;
  SELECT count(*) INTO counter FROM public.invite_code_attempts WHERE user_id=tester;
  IF counter<>5 THEN RAISE EXCEPTION 'Failed attempts were rolled back or overcounted'; END IF;
  -- Rule: the rolling-hour limit expires.
  UPDATE public.invite_code_attempts SET attempted_at=clock_timestamp()-interval '61 minutes' WHERE user_id=tester;
  -- Rule: inactive and rejected give the same generic failure as unknown.
  UPDATE public.invite_codes SET active=false WHERE id=code_id;
  result := public.redeem_invite_code('ABCD2345');
  IF result <> '{"ok":false,"error":"Código no válido"}'::jsonb THEN RAISE EXCEPTION 'Inactive code leaked'; END IF;
  UPDATE public.invite_codes SET active=true WHERE id=code_id;
  UPDATE public.user_approvals SET status='rechazado' WHERE user_id=tester;
  result := public.redeem_invite_code('ABCD2345');
  IF result <> '{"ok":false,"error":"Código no válido"}'::jsonb THEN RAISE EXCEPTION 'Rejected user was approved'; END IF;
  UPDATE public.user_approvals SET status='pendiente' WHERE user_id=tester;
  -- Rules: case, whitespace and hyphens normalize; approval starts exactly seven days; count/history atomic.
  PERFORM set_config('role','authenticated',true);
  result := public.redeem_invite_code(E' abcd - 23 45\t');
  IF result <> '{"ok":true}'::jsonb THEN RAISE EXCEPTION 'Normalization or redemption failed'; END IF;
  PERFORM set_config('role','postgres',true);
  SELECT * INTO trial FROM public.app_trials WHERE user_id=tester;
  IF trial.user_id IS NULL OR trial.ends_at-trial.started_at<>interval '7 days' THEN RAISE EXCEPTION 'Seven-day trial rule failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.user_approvals WHERE user_id=tester AND status='aprobado' AND approved_at=trial.started_at) THEN RAISE EXCEPTION 'Approval anchor failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.invite_code_uses WHERE user_id=tester AND invite_code_id=code_id AND used_at=trial.started_at) THEN RAISE EXCEPTION 'Usage audit failed'; END IF;
  IF (SELECT uses FROM public.invite_codes WHERE id=code_id)<>1 THEN RAISE EXCEPTION 'Usage count failed'; END IF;
  initial_time:=trial.started_at;
  -- Rule: approved user is a no-op even with a wrong code.
  result := public.redeem_invite_code('WRONG');
  IF result <> '{"ok":true}'::jsonb OR (SELECT uses FROM public.invite_codes WHERE id=code_id)<>1 OR (SELECT started_at FROM public.app_trials WHERE user_id=tester)<>initial_time THEN RAISE EXCEPTION 'Approved no-op failed'; END IF;
  -- Rule: manual approval still starts the identical seven-day trial mechanism.
  UPDATE public.user_approvals SET status='pendiente' WHERE user_id=tester;
  PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('role','authenticated',true);
  PERFORM public.decide_user_approval(tester,'aprobado');
  PERFORM set_config('role','postgres',true);
  SELECT * INTO trial FROM public.app_trials WHERE user_id=tester;
  IF trial.ends_at-trial.started_at<>interval '7 days' OR NOT EXISTS(SELECT 1 FROM public.user_approvals WHERE user_id=tester AND approved_at=trial.started_at AND status='aprobado') THEN RAISE EXCEPTION 'Manual mechanism regressed'; END IF;
  RAISE EXCEPTION SQLSTATE 'ZX001' USING MESSAGE='All invitation database rules passed';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN
  RAISE NOTICE 'All invitation database rules passed; all test writes rolled back';
 END;
END;
$tests$;