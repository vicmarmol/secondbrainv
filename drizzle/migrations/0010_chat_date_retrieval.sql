CREATE FUNCTION public.search_chat_documents_by_date(topic text DEFAULT '', period_start timestamptz DEFAULT NULL, period_end timestamptz DEFAULT NULL)
RETURNS TABLE(document_id text, title text, source public.document_source, modified_at timestamptz, excerpt text, rank real)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
WITH q AS (SELECT websearch_to_tsquery('spanish', topic) AS query)
SELECT d.id, d.title, d.source, d.source_modified_at,
left(ts_headline('spanish', coalesce(nullif(d.content,''),d.summary), q.query, 'StartSel=, StopSel=, MaxFragments=8, MinWords=25, MaxWords=80, FragmentDelimiter= … '),3000), ts_rank_cd(d.search_vector,q.query)
FROM public.documents d CROSS JOIN q
WHERE d.user_id=auth.uid() AND NOT d.excluded AND d.source_modified_at IS NOT NULL
AND (topic='' OR d.search_vector @@ q.query)
AND (period_start IS NULL OR d.source_modified_at >= period_start)
AND (period_end IS NULL OR d.source_modified_at < period_end)
ORDER BY d.source_modified_at DESC, d.id LIMIT 8;
$$;
REVOKE ALL ON FUNCTION public.search_chat_documents_by_date(text,timestamptz,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_chat_documents_by_date(text,timestamptz,timestamptz) TO authenticated;