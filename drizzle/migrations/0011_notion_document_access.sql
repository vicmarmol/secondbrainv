ALTER TABLE public.documents ADD COLUMN inaccessible boolean NOT NULL DEFAULT false;
ALTER TABLE public.sync_runs ADD COLUMN inaccessible_documents integer NOT NULL DEFAULT 0;
CREATE FUNCTION public.finish_notion_sync(sync_id uuid, sync_progress jsonb, new_count integer, updated_count integer)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE r public.sync_runs; missing_count integer := 0; accessible_count integer; complete_scan boolean;
BEGIN
 SELECT * INTO r FROM public.sync_runs WHERE id=sync_id AND user_id=auth.uid() AND status='en_curso' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sincronización no disponible'; END IF;
 PERFORM 1 FROM public.connections WHERE id=r.connection_id AND user_id=auth.uid() AND source='notion' AND status='conectado' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Notion desconectado'; END IF;
 complete_scan := coalesce((sync_progress #>> '{discovery,trackingComplete}')::boolean,false)
 AND coalesce((sync_progress #>> '{discovery,done}')::boolean,false)
 AND jsonb_array_length(sync_progress #> '{discovery,pages}')=0
 AND jsonb_array_length(sync_progress #> '{discovery,sources}')=0
 AND sync_progress->'current'='null'::jsonb;
 IF complete_scan THEN
 UPDATE public.documents d SET inaccessible=NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(sync_progress #> '{discovery,seen}') s(id) WHERE s.id=d.external_id)
 WHERE d.user_id=auth.uid() AND d.source='notion';
 END IF;
 SELECT count(*) INTO missing_count FROM public.documents WHERE user_id=auth.uid() AND source='notion' AND inaccessible;
 SELECT count(*) INTO accessible_count FROM public.documents WHERE user_id=auth.uid() AND source='notion' AND NOT excluded AND NOT inaccessible AND content_hash IS NOT NULL;
 UPDATE public.connections SET last_synced_at=now(), document_count=accessible_count, notion_cursor=CASE WHEN complete_scan THEN NULL ELSE sync_progress->'discovery' END WHERE id=r.connection_id AND user_id=auth.uid();
 UPDATE public.sync_runs SET progress=sync_progress, new_documents=new_count, updated_documents=updated_count, inaccessible_documents=missing_count, status='completada', finished_at=now() WHERE id=r.id AND user_id=auth.uid();
 RETURN missing_count;
END $$;
REVOKE ALL ON FUNCTION public.finish_notion_sync(uuid,jsonb,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_notion_sync(uuid,jsonb,integer,integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.search_chat_documents(question text)
RETURNS TABLE(document_id text, title text, source public.document_source, modified_at timestamptz, excerpt text, rank real)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
WITH q AS (SELECT websearch_to_tsquery('spanish', question) AS query)
SELECT d.id, d.title, d.source, coalesce(d.source_modified_at,d.updated_at),
left(ts_headline('spanish', coalesce(nullif(d.content,''),d.summary), q.query, 'StartSel=, StopSel=, MaxFragments=8, MinWords=25, MaxWords=80, FragmentDelimiter= … '),3000),
ts_rank_cd(d.search_vector,q.query)
FROM public.documents d CROSS JOIN q
WHERE d.user_id = auth.uid() AND NOT d.excluded AND NOT d.inaccessible AND d.search_vector @@ q.query
ORDER BY ts_rank_cd(d.search_vector,q.query) DESC, d.id LIMIT 8;
$$;
CREATE OR REPLACE FUNCTION public.search_chat_documents_by_date(topic text DEFAULT '', period_start timestamptz DEFAULT NULL, period_end timestamptz DEFAULT NULL)
RETURNS TABLE(document_id text, title text, source public.document_source, modified_at timestamptz, excerpt text, rank real)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
WITH q AS (SELECT websearch_to_tsquery('spanish', topic) AS query)
SELECT d.id, d.title, d.source, d.source_modified_at,
left(ts_headline('spanish', coalesce(nullif(d.content,''),d.summary), q.query, 'StartSel=, StopSel=, MaxFragments=8, MinWords=25, MaxWords=80, FragmentDelimiter= … '),3000), ts_rank_cd(d.search_vector,q.query)
FROM public.documents d CROSS JOIN q
WHERE d.user_id=auth.uid() AND NOT d.excluded AND NOT d.inaccessible AND d.source_modified_at IS NOT NULL
AND (topic='' OR d.search_vector @@ q.query)
AND (period_start IS NULL OR d.source_modified_at >= period_start)
AND (period_end IS NULL OR d.source_modified_at < period_end)
ORDER BY d.source_modified_at DESC, d.id LIMIT 8;
$$;