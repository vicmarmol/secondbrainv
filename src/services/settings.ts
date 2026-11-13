import { supabase } from '@/integrations/supabase/client';
export async function loadSampleData() {
 const { error } = await supabase.rpc('load_sample_data');
 if (error) throw new Error('No se han podido cargar los datos de ejemplo.');
}
export async function signOut() { await supabase.auth.signOut(); }
export async function getCurrentEmail() { const { data } = await supabase.auth.getUser(); return data.user?.email ?? null; }
