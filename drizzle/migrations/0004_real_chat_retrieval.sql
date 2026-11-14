ALTER TABLE public.documents ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (setweight(to_tsvector('spanish'::regconfig, coalesce(title,'')), 'A') || setweight(to_tsvector('spanish'::regconfig, coalesce(summary,'')), 'B') || setweight(to_tsvector('spanish'::regconfig, coalesce(content,'')), 'C')) STORED;
CREATE INDEX documents_search_vector_gin ON public.documents USING gin(search_vector) WHERE excluded = false;
ALTER TABLE public.messages ADD COLUMN answer_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE FUNCTION public.search_chat_documents(question text) RETURNS TABLE(document_id text, title text, source public.document_source, modified_at timestamptz, excerpt text, rank real) LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
WITH q AS (SELECT websearch_to_tsquery('spanish', question) AS query)
SELECT d.id, d.title, d.source, coalesce(d.source_modified_at,d.updated_at), left(ts_headline('spanish', coalesce(nullif(d.content,''),d.summary), q.query, 'StartSel=, StopSel=, MaxFragments=8, MinWords=25, MaxWords=80, FragmentDelimiter= … '),3000), ts_rank(d.search_vector,q.query)
FROM public.documents d CROSS JOIN q
WHERE d.user_id = auth.uid() AND NOT d.excluded AND d.search_vector @@ q.query
ORDER BY ts_rank(d.search_vector,q.query) DESC, d.id LIMIT 6;
$$;
REVOKE ALL ON FUNCTION public.search_chat_documents(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_chat_documents(text) TO authenticated;
CREATE TABLE public.chat_ai_access (user_id uuid PRIMARY KEY DEFAULT auth.uid(), denial jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_ai_access TO authenticated;
GRANT ALL ON public.chat_ai_access TO service_role;
ALTER TABLE public.chat_ai_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own AI access state" ON public.chat_ai_access FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());