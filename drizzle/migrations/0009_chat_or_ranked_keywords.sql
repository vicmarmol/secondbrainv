CREATE OR REPLACE FUNCTION public.search_chat_documents(question text)
RETURNS TABLE(document_id text, title text, source public.document_source, modified_at timestamptz, excerpt text, rank real)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
WITH q AS (SELECT websearch_to_tsquery('spanish', question) AS query)
SELECT d.id, d.title, d.source, coalesce(d.source_modified_at,d.updated_at),
left(ts_headline('spanish', coalesce(nullif(d.content,''),d.summary), q.query, 'StartSel=, StopSel=, MaxFragments=8, MinWords=25, MaxWords=80, FragmentDelimiter= … '),3000),
ts_rank_cd(d.search_vector,q.query)
FROM public.documents d CROSS JOIN q
WHERE d.user_id = auth.uid() AND NOT d.excluded AND d.search_vector @@ q.query
ORDER BY ts_rank_cd(d.search_vector,q.query) DESC, d.id LIMIT 8;
$$;
REVOKE ALL ON FUNCTION public.search_chat_documents(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_chat_documents(text) TO authenticated;