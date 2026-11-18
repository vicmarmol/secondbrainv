ALTER TABLE public.sync_runs ADD COLUMN IF NOT EXISTS trigger text NOT NULL DEFAULT 'manual' CHECK (trigger IN ('manual','automatica'));
ALTER TABLE public.sync_runs ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS attention_message text;

CREATE OR REPLACE FUNCTION public.finish_notion_sync(sync_id uuid, sync_progress jsonb, new_count integer, updated_count integer, owner uuid)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE r public.sync_runs; uid uuid; missing_count integer := 0; accessible_count integer; complete_scan boolean;
BEGIN
 uid := coalesce(auth.uid(), CASE WHEN auth.role()='service_role' THEN owner END);
 IF uid IS NULL OR (auth.uid() IS NOT NULL AND owner <> auth.uid()) THEN RAISE EXCEPTION 'Sincronización no disponible'; END IF;
 SELECT * INTO r FROM public.sync_runs WHERE id=sync_id AND user_id=uid AND status='en_curso' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sincronización no disponible'; END IF;
 PERFORM 1 FROM public.connections WHERE id=r.connection_id AND user_id=uid AND source='notion' AND status='conectado' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Notion desconectado'; END IF;
 complete_scan := coalesce((sync_progress #>> '{discovery,trackingComplete}')::boolean,false)
  AND coalesce((sync_progress #>> '{discovery,done}')::boolean,false)
  AND jsonb_array_length(sync_progress #> '{discovery,pages}')=0
  AND jsonb_array_length(sync_progress #> '{discovery,sources}')=0
  AND sync_progress->'current'='null'::jsonb;
 IF complete_scan THEN
  UPDATE public.documents d SET inaccessible=NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(sync_progress #> '{discovery,seen}') s(id) WHERE s.id=d.external_id)
  WHERE d.user_id=uid AND d.source='notion' AND NOT d.is_sample;
 END IF;
 SELECT count(*) INTO missing_count FROM public.documents WHERE user_id=uid AND source='notion' AND inaccessible AND NOT is_sample;
 SELECT count(*) INTO accessible_count FROM public.documents WHERE user_id=uid AND source='notion' AND NOT excluded AND NOT inaccessible AND NOT is_sample AND content_hash IS NOT NULL;
 UPDATE public.connections SET last_synced_at=now(), document_count=accessible_count, attention_message=NULL, notion_cursor=CASE WHEN complete_scan THEN NULL ELSE sync_progress->'discovery' END WHERE id=r.connection_id AND user_id=uid;
 UPDATE public.sync_runs SET progress=sync_progress, new_documents=new_count, updated_documents=updated_count, inaccessible_documents=missing_count, status='completada', finished_at=now(), lease_until=NULL WHERE id=r.id AND user_id=uid;
 RETURN missing_count;
END $$;
REVOKE ALL ON FUNCTION public.finish_notion_sync(uuid,jsonb,integer,integer,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_notion_sync(uuid,jsonb,integer,integer,uuid) TO authenticated, service_role;
COMMENT ON FUNCTION public.finish_notion_sync(uuid,jsonb,integer,integer) IS 'DEPRECATED: replaced by the owner-aware overload';