GRANT UPDATE (status, last_synced_at) ON public.connections TO anon, authenticated;
CREATE POLICY "Conexiones editables" ON public.connections FOR UPDATE TO anon, authenticated USING (status <> 'proximamente') WITH CHECK (status <> 'proximamente');
GRANT INSERT (id, title), UPDATE (title, updated_at), DELETE ON public.conversations TO anon, authenticated;
CREATE POLICY "Conversaciones creables" ON public.conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Conversaciones renombrables" ON public.conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Conversaciones borrables" ON public.conversations FOR DELETE TO anon, authenticated USING (true);
GRANT INSERT (id, conversation_id, role, content, citations) ON public.messages TO anon, authenticated;
CREATE POLICY "Mensajes creables" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.touch_conversation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id; RETURN NEW; END $$;
CREATE TRIGGER messages_touch_conversation AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();