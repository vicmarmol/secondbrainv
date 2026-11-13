DELETE FROM public.messages WHERE id IS NOT NULL;
DELETE FROM public.conversations WHERE id IS NOT NULL;
DELETE FROM public.sync_runs WHERE id IS NOT NULL;
DELETE FROM public.connections WHERE id IS NOT NULL;
DELETE FROM public.documents WHERE id IS NOT NULL;

DROP POLICY IF EXISTS "Indice legible" ON public.documents;
DROP POLICY IF EXISTS "Etiquetas y exclusion editables" ON public.documents;
DROP POLICY IF EXISTS "Conversaciones legibles" ON public.conversations;
DROP POLICY IF EXISTS "Conversaciones creables" ON public.conversations;
DROP POLICY IF EXISTS "Conversaciones renombrables" ON public.conversations;
DROP POLICY IF EXISTS "Conversaciones borrables" ON public.conversations;
DROP POLICY IF EXISTS "Mensajes legibles" ON public.messages;
DROP POLICY IF EXISTS "Mensajes creables" ON public.messages;
DROP POLICY IF EXISTS "Conexiones legibles" ON public.connections;
DROP POLICY IF EXISTS "Conexiones editables" ON public.connections;
DROP POLICY IF EXISTS "Sincronizaciones legibles" ON public.sync_runs;

ALTER TABLE public.documents ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.connections ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sync_runs ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX documents_user_idx ON public.documents(user_id);
CREATE INDEX conversations_user_idx ON public.conversations(user_id, updated_at DESC);
CREATE INDEX messages_user_idx ON public.messages(user_id);
CREATE INDEX sync_runs_user_idx ON public.sync_runs(user_id);

ALTER TABLE public.connections ADD COLUMN source text NOT NULL DEFAULT '';
ALTER TABLE public.connections ADD CONSTRAINT connections_user_source_key UNIQUE (user_id, source);

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_source_external_id_key;
ALTER TABLE public.documents ADD CONSTRAINT documents_user_source_external_id_key UNIQUE (user_id, source, external_id);

ALTER TABLE public.documents ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.conversations ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.messages ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.connections ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

REVOKE ALL ON public.documents, public.conversations, public.messages, public.connections, public.sync_runs FROM anon;
REVOKE ALL ON public.documents, public.conversations, public.messages, public.connections, public.sync_runs FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents, public.conversations, public.messages, public.connections, public.sync_runs TO authenticated;
GRANT ALL ON public.documents, public.conversations, public.messages, public.connections, public.sync_runs TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own documents select" ON public.documents FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own documents insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own documents update" ON public.documents FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own documents delete" ON public.documents FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Own conversations select" ON public.conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own conversations insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own conversations update" ON public.conversations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own conversations delete" ON public.conversations FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Own messages select" ON public.messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own messages insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Own messages update" ON public.messages FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Own messages delete" ON public.messages FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Own connections select" ON public.connections FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own connections insert" ON public.connections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own connections update" ON public.connections FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status <> 'proximamente') WITH CHECK (user_id = auth.uid() AND status <> 'proximamente');
CREATE POLICY "Own connections delete" ON public.connections FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Own sync runs select" ON public.sync_runs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own sync runs insert" ON public.sync_runs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.connections c WHERE c.id = connection_id AND c.user_id = auth.uid()));
CREATE POLICY "Own sync runs update" ON public.sync_runs FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own sync runs delete" ON public.sync_runs FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_conversation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id AND user_id = NEW.user_id; RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.touch_conversation() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_connections() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.connections (user_id, source, provider, status) VALUES
  (NEW.id,'notion','Notion','desconectado'),
  (NEW.id,'drive','Google Drive','desconectado'),
  (NEW.id,'dropbox','Dropbox','desconectado'),
  (NEW.id,'granola','Granola','desconectado'),
  (NEW.id,'garmin','Garmin / Strava','desconectado'),
  (NEW.id,'gmail','Gmail','proximamente'),
  (NEW.id,'whatsapp','WhatsApp','proximamente')
  ON CONFLICT (user_id, source) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_connections() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created_connections AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_connections();

CREATE OR REPLACE FUNCTION public.load_sample_data() RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); c record; cid text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.documents WHERE user_id = uid AND external_id = 'doc-1') THEN RETURN; END IF;

  INSERT INTO public.documents (user_id,title,source,type,status,summary,tags,content,external_id,external_url,content_hash,source_modified_at)
  SELECT uid, v.title, v.source::public.document_source, v.type::public.document_type, 'indexado', v.summary,
    CASE WHEN v.type = 'entreno' OR v.id IN ('doc-10','doc-18') THEN ARRAY['Ciclismo','Entrenamiento'] ELSE ARRAY['Producto','Aprendizaje'] END,
    v.summary, v.id,
    CASE v.source
      WHEN 'notion' THEN 'https://www.notion.so/' || substr(md5(v.id), 1, 32)
      WHEN 'drive' THEN 'https://drive.google.com/file/d/' || substr(md5(v.id), 1, 28) || '/view'
      WHEN 'dropbox' THEN 'https://www.dropbox.com/home?preview=' || replace(v.title, ' ', '_') || '.pdf'
      WHEN 'granola' THEN 'https://notes.granola.ai/d/' || substr(md5(v.id), 1, 20)
      WHEN 'garmin' THEN 'https://connect.garmin.com/modern/activity/' || (18000000000 + abs(hashtext(v.id)) % 1000000000)::text
      ELSE 'https://mail.google.com/mail/u/0/#inbox/' || substr(md5(v.id), 1, 16)
    END,
    md5(v.summary), (v.d || 'T09:00:00Z')::timestamptz
  FROM (VALUES
  ('doc-1','Curso de Product Discovery · El MVP','drive','pdf','2026-10-30','Un MVP es un producto con las funcionalidades mínimas para validar una hipótesis con usuarios reales. Su objetivo es aprender, no ser una versión reducida del producto final.'),
  ('doc-2','Mis notas sobre el MVP','notion','nota','2026-10-13','Un MVP es la primera versión funcional que se puede vender o usar de verdad. Debe resolver un problema completo, aunque sea para un grupo pequeño de clientes.'),
  ('doc-3','Reunión de producto · Sprint 24','granola','reunion','2026-11-12','Decisiones: priorizar el onboarding; validar el nuevo pricing con cinco clientes; posponer las notificaciones al siguiente sprint. Tareas: Laura preparará el prototipo de onboarding para el 16 de noviembre. Pablo organizará las entrevistas de pricing para el 17 de noviembre.'),
  ('doc-4','Salidas en bici · Noviembre y octubre','garmin','entreno','2026-11-13','Noviembre, semanas 1 y 2: 112 y 138 km. Octubre, semanas 1 y 2: 86 y 104 km. En periodos equivalentes, el volumen ha subido de 190 a 250 km (+31,6 %). Noviembre sigue en curso.'),
  ('doc-5','Correo de Marta · Propuesta de pricing','gmail','nota','2026-11-10','Marta Ruiz, responsable de ventas, propuso el 10 de noviembre probar un plan por equipo en lugar de cobrar por usuario. Mantener la prueba gratuita de 14 días.'),
  ('doc-6','Pricing · Conversación con Diego','granola','reunion','2026-11-09','El 9 de noviembre hablé con Diego Martín, responsable de producto, sobre pricing. Acordamos validar el precio por equipo con cinco clientes antes de cambiar los planes actuales.'),
  ('doc-7','Roadmap de producto · Q4','notion','nota','2026-11-11','Prioridades del trimestre: activación, retención y aprendizaje cualitativo. El onboarding es la apuesta principal.'),
  ('doc-8','Inspired · Apuntes de lectura','notion','nota','2026-11-08','Los equipos de producto deben resolver problemas, no limitarse a entregar funcionalidades. Riesgos: valor, usabilidad, viabilidad y factibilidad.'),
  ('doc-9','Entrevista con Ana · Onboarding','granola','reunion','2026-11-07','Ana se bloqueó al importar sus primeros documentos. Prefiere empezar con un ejemplo antes de conectar su cuenta.'),
  ('doc-10','Plan de entrenamiento · Base aeróbica','dropbox','pdf','2026-11-06','Dos sesiones en zona 2, una sesión de intervalos y una salida larga por semana. El lunes es día de descanso.'),
  ('doc-11','Salida · Casa de Campo','garmin','entreno','2026-11-05','42 km, 520 m de desnivel y 1 h 52 min. Sensaciones buenas; mantener ritmo suave al inicio.'),
  ('doc-12','The Mom Test · Preguntas útiles','notion','nota','2026-11-04','Preguntar por comportamientos pasados, no por intenciones futuras. Evitar presentar la solución durante las entrevistas.'),
  ('doc-13','Métricas de activación · Octubre','drive','pdf','2026-11-03','La activación se define como guardar tres documentos y realizar una primera consulta durante los primeros siete días.'),
  ('doc-14','Retro del equipo · Sprint 23','granola','reunion','2026-11-02','Reducir el trabajo en paralelo y reservar una hora semanal para revisar lo aprendido en las entrevistas.'),
  ('doc-15','Ruta larga · Sierra de Madrid','garmin','entreno','2026-11-01','70 km y 980 m de desnivel. Tomar 60 gramos de carbohidratos por hora en salidas de más de dos horas.'),
  ('doc-16','Curso de investigación · Síntesis','drive','pdf','2026-10-29','Agrupar observaciones por patrones y separar los hechos de las interpretaciones del equipo.'),
  ('doc-17','Ideas para mejorar la búsqueda','notion','nota','2026-10-27','Mostrar siempre el origen de cada respuesta y destacar los documentos que se contradicen.'),
  ('doc-18','Objetivos de ciclismo · Invierno','dropbox','nota','2026-10-25','Mantener la constancia con tres salidas semanales y mejorar la resistencia en subidas largas.'),
  ('doc-19','Revisión de diseño · Biblioteca','granola','reunion','2026-10-23','Los filtros deben permitir combinar origen, tipo y fecha. El estado de indexación debe ser visible.'),
  ('doc-20','Continuous Discovery Habits · Notas','notion','nota','2026-10-20','Mantener contacto semanal con clientes. Conectar oportunidades con resultados de producto concretos.')
  ) AS v(id,title,source,type,d,summary)
  ON CONFLICT (user_id, source, external_id) DO NOTHING;

  UPDATE public.connections k SET status = 'conectado', last_synced_at = v.ts::timestamptz, document_count = v.n
  FROM (VALUES ('notion','2026-11-13T08:00:00Z',7),('drive','2026-11-13T08:00:00Z',4),('dropbox','2026-11-12T08:00:00Z',2),('granola','2026-11-13T08:00:00Z',5),('garmin','2026-11-13T08:00:00Z',3)) AS v(src,ts,n)
  WHERE k.user_id = uid AND k.source = v.src;

  INSERT INTO public.sync_runs (user_id, connection_id, started_at, finished_at, status, new_documents, updated_documents)
  SELECT uid, k.id, v.s::timestamptz, v.f::timestamptz, 'completada', v.nd, v.ud
  FROM (VALUES ('notion','2026-11-13T08:00:00Z','2026-11-13T08:00:40Z',1,2),('drive','2026-11-13T08:00:00Z','2026-11-13T08:00:25Z',0,1),('dropbox','2026-11-12T08:00:00Z','2026-11-12T08:00:15Z',0,0),('granola','2026-11-13T08:00:00Z','2026-11-13T08:00:30Z',1,0),('garmin','2026-11-13T08:00:00Z','2026-11-13T08:00:20Z',1,0)) AS v(src,s,f,nd,ud)
  JOIN public.connections k ON k.user_id = uid AND k.source = v.src;

  FOR c IN SELECT * FROM (VALUES
    ('Decisiones de la última reunión','2026-11-13T17:00:00Z','¿Qué acordamos en la última reunión de producto?','En la reunión del 12 de noviembre acordamos priorizar el onboarding, validar el pricing con cinco clientes y posponer las notificaciones. Laura preparará el prototipo para el 16 de noviembre y Pablo organizará las entrevistas para el 17.','[{"document_id":"doc-3"}]'),
    ('Mi progreso en la bici','2026-11-13T16:00:00Z','¿Cómo va mi entrenamiento?','Tu plan de base aeróbica combina dos sesiones en zona 2, intervalos y una salida larga. El lunes queda reservado para descansar.','[{"document_id":"doc-10"}]'),
    ('Ideas para el nuevo onboarding','2026-11-12T15:00:00Z','¿Qué aprendimos de Ana sobre el onboarding?','Ana se bloqueó al importar sus primeros documentos. Prefiere empezar con un ejemplo antes de conectar su cuenta.','[{"document_id":"doc-9"}]'),
    ('Notas de Inspired','2026-11-12T14:00:00Z','Recuerda mis notas de Inspired','Los equipos deben resolver problemas, no limitarse a entregar funcionalidades. Evalúa los riesgos de valor, usabilidad, viabilidad y factibilidad.','[{"document_id":"doc-8"}]'),
    ('Revisión del pricing','2026-11-09T13:00:00Z','¿Con quién revisé el pricing?','Con Marta Ruiz el 10 de noviembre por correo, y con Diego Martín el 9 de noviembre en una reunión. Ambos plantearon validar un precio por equipo.','[{"document_id":"doc-5"},{"document_id":"doc-6"}]')
  ) AS v(title, ts, q, a, cit) LOOP
    INSERT INTO public.conversations (user_id, title, created_at) VALUES (uid, c.title, c.ts::timestamptz) RETURNING id INTO cid;
    INSERT INTO public.messages (user_id, conversation_id, role, content, citations, created_at) VALUES
      (uid, cid, 'user', c.q, '[]', c.ts::timestamptz),
      (uid, cid, 'assistant', c.a, c.cit::jsonb, c.ts::timestamptz + interval '5 seconds');
    UPDATE public.conversations SET updated_at = c.ts::timestamptz WHERE id = cid;
  END LOOP;
END; $$;
REVOKE EXECUTE ON FUNCTION public.load_sample_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.load_sample_data() TO authenticated;