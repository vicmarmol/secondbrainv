CREATE TYPE public.document_source AS ENUM ('notion','drive','dropbox','granola','garmin','gmail');
CREATE TYPE public.document_type AS ENUM ('nota','pdf','reunion','entreno');
CREATE TYPE public.document_status AS ENUM ('indexado','procesando','error');
CREATE TYPE public.connection_status AS ENUM ('conectado','desconectado','proximamente');
CREATE TYPE public.sync_status AS ENUM ('en_curso','completada','error');
CREATE TYPE public.message_role AS ENUM ('user','assistant');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.documents (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  source public.document_source NOT NULL,
  type public.document_type NOT NULL,
  status public.document_status NOT NULL DEFAULT 'procesando',
  summary text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  content text NOT NULL DEFAULT '',
  external_id text NOT NULL,
  external_url text NOT NULL,
  content_hash text,
  source_modified_at timestamptz,
  excluded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
GRANT SELECT ON public.documents TO anon, authenticated;
GRANT UPDATE (tags, excluded) ON public.documents TO anon, authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Indice legible" ON public.documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Etiquetas y exclusion editables" ON public.documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.conversations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.conversations TO anon, authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversaciones legibles" ON public.conversations FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.messages (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id text NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role public.message_role NOT NULL,
  content text NOT NULL,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON public.messages(conversation_id, created_at);
GRANT SELECT ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mensajes legibles" ON public.messages FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.connections (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider text NOT NULL,
  status public.connection_status NOT NULL DEFAULT 'desconectado',
  last_synced_at timestamptz,
  document_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.connections TO anon, authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conexiones legibles" ON public.connections FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id text NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status public.sync_status NOT NULL DEFAULT 'en_curso',
  new_documents integer NOT NULL DEFAULT 0,
  updated_documents integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.sync_runs TO anon, authenticated;
GRANT ALL ON public.sync_runs TO service_role;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sincronizaciones legibles" ON public.sync_runs FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.documents (id,title,source,type,status,summary,tags,content,external_id,external_url,content_hash,source_modified_at,created_at,updated_at)
SELECT v.id, v.title, v.source::public.document_source, v.type::public.document_type, 'indexado', v.summary,
  CASE WHEN v.type = 'entreno' OR v.id = 'doc-10' OR v.id = 'doc-18' THEN ARRAY['Ciclismo','Entrenamiento'] ELSE ARRAY['Producto','Aprendizaje'] END,
  v.summary, v.source || '-' || substr(md5(v.id), 1, 12),
  CASE v.source
    WHEN 'notion' THEN 'https://www.notion.so/alexlopez/' || substr(md5(v.id), 1, 32)
    WHEN 'drive' THEN 'https://drive.google.com/file/d/' || substr(md5(v.id), 1, 28) || '/view'
    WHEN 'dropbox' THEN 'https://www.dropbox.com/home/Entrenamiento?preview=' || replace(v.title, ' ', '_') || '.pdf'
    WHEN 'granola' THEN 'https://notes.granola.ai/d/' || substr(md5(v.id), 1, 20)
    WHEN 'garmin' THEN 'https://connect.garmin.com/modern/activity/' || (18000000000 + abs(hashtext(v.id)) % 1000000000)::text
    ELSE 'https://mail.google.com/mail/u/0/#inbox/' || substr(md5(v.id), 1, 16)
  END,
  md5(v.summary), (v.d || 'T09:00:00Z')::timestamptz, (v.d || 'T10:00:00Z')::timestamptz, (v.d || 'T10:00:00Z')::timestamptz
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
) AS v(id,title,source,type,d,summary);

INSERT INTO public.connections (id,provider,status,last_synced_at,document_count) VALUES
('notion','Notion','conectado','2026-11-13T08:00:00Z',7),
('drive','Google Drive','conectado','2026-11-13T08:00:00Z',4),
('dropbox','Dropbox','conectado','2026-11-12T08:00:00Z',2),
('granola','Granola','conectado','2026-11-13T08:00:00Z',5),
('garmin','Garmin / Strava','conectado','2026-11-13T08:00:00Z',3),
('gmail','Gmail','proximamente',NULL,0),
('whatsapp','WhatsApp','proximamente',NULL,0);

INSERT INTO public.sync_runs (connection_id,started_at,finished_at,status,new_documents,updated_documents) VALUES
('notion','2026-11-13T08:00:00Z','2026-11-13T08:00:40Z','completada',1,2),
('drive','2026-11-13T08:00:00Z','2026-11-13T08:00:25Z','completada',0,1),
('dropbox','2026-11-12T08:00:00Z','2026-11-12T08:00:15Z','completada',0,0),
('granola','2026-11-13T08:00:00Z','2026-11-13T08:00:30Z','completada',1,0),
('garmin','2026-11-13T08:00:00Z','2026-11-13T08:00:20Z','completada',1,0);

INSERT INTO public.conversations (id,title,created_at,updated_at) VALUES
('c1','Decisiones de la última reunión','2026-11-13T17:00:00Z','2026-11-13T17:00:00Z'),
('c2','Mi progreso en la bici','2026-11-13T16:00:00Z','2026-11-13T16:00:00Z'),
('c3','Ideas para el nuevo onboarding','2026-11-12T15:00:00Z','2026-11-12T15:00:00Z'),
('c4','Notas de Inspired','2026-11-12T14:00:00Z','2026-11-12T14:00:00Z'),
('c5','Revisión del pricing','2026-11-09T13:00:00Z','2026-11-09T13:00:00Z');

INSERT INTO public.messages (id,conversation_id,role,content,citations,created_at) VALUES
('c1-user','c1','user','¿Qué acordamos en la última reunión de producto?','[]','2026-11-13T17:00:00Z'),
('c1-answer','c1','assistant','En la reunión del 12 de noviembre acordamos priorizar el onboarding, validar el pricing con cinco clientes y posponer las notificaciones. Laura preparará el prototipo para el 16 de noviembre y Pablo organizará las entrevistas para el 17.','[{"document_id":"doc-3"}]','2026-11-13T17:00:05Z'),
('c2-user','c2','user','¿Cómo va mi entrenamiento?','[]','2026-11-13T16:00:00Z'),
('c2-answer','c2','assistant','Tu plan de base aeróbica combina dos sesiones en zona 2, intervalos y una salida larga. El lunes queda reservado para descansar.','[{"document_id":"doc-10"}]','2026-11-13T16:00:05Z'),
('c3-user','c3','user','¿Qué aprendimos de Ana sobre el onboarding?','[]','2026-11-12T15:00:00Z'),
('c3-answer','c3','assistant','Ana se bloqueó al importar sus primeros documentos. Prefiere empezar con un ejemplo antes de conectar su cuenta.','[{"document_id":"doc-9"}]','2026-11-12T15:00:05Z'),
('c4-user','c4','user','Recuerda mis notas de Inspired','[]','2026-11-12T14:00:00Z'),
('c4-answer','c4','assistant','Los equipos deben resolver problemas, no limitarse a entregar funcionalidades. Evalúa los riesgos de valor, usabilidad, viabilidad y factibilidad.','[{"document_id":"doc-8"}]','2026-11-12T14:00:05Z'),
('c5-user','c5','user','¿Con quién revisé el pricing?','[]','2026-11-09T13:00:00Z'),
('c5-answer','c5','assistant','Con Marta Ruiz el 10 de noviembre por correo, y con Diego Martín el 9 de noviembre en una reunión. Ambos plantearon validar un precio por equipo.','[{"document_id":"doc-5"},{"document_id":"doc-6"}]','2026-11-09T13:00:05Z');