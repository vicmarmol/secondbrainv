ALTER TABLE public.connections ADD COLUMN notion_cursor jsonb;
ALTER TABLE public.sync_runs ADD COLUMN progress jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.sync_runs ADD COLUMN error_message text;
CREATE UNIQUE INDEX sync_runs_one_active_connection ON public.sync_runs(connection_id) WHERE status = 'en_curso';