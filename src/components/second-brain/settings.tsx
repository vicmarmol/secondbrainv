import { useState } from 'react';
import { Database, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { loadSampleData, deleteSampleData } from '@/services';

export function SettingsView() {
 const [busy, setBusy] = useState(false);
 async function load() {
  setBusy(true);
  try { await loadSampleData(); toast.success('Datos de ejemplo cargados'); setTimeout(() => window.location.assign('/biblioteca'), 600); }
  catch (e) { toast.error((e as Error).message); }
  finally { setBusy(false); }
 }
 async function remove() {
  if (!window.confirm('¿Eliminar todos los datos de ejemplo? Tus datos reales no se tocan.')) return;
  setBusy(true);
  try { await deleteSampleData(); toast.success('Datos de ejemplo eliminados'); }
  catch (e) { toast.error((e as Error).message); }
  finally { setBusy(false); }
 }
 return <div className="mx-auto w-full max-w-3xl overflow-y-auto p-6">
  <h1 className="text-2xl font-semibold">Ajustes</h1>
  <p className="mt-1 text-sm text-muted-foreground">Configura tu espacio personal.</p>
  <section className="mt-6 rounded-lg border border-border bg-card p-4">
   <h2 className="font-medium">Datos de ejemplo</h2>
   <p className="mt-1 text-sm text-muted-foreground">Añade 20 documentos y 5 conversaciones de ejemplo para explorar la aplicación. No cambia tus conexiones y puedes eliminarlos cuando quieras. Solo tú podrás verlos.</p>
   <Button className="mt-4" onClick={load} disabled={busy}><Database/>{busy ? 'Cargando…' : 'Cargar datos de ejemplo'}</Button>
   <Button className="ml-2 mt-4" variant="outline" onClick={remove} disabled={busy}><Trash2/>Eliminar datos de ejemplo</Button>
  </section>
 </div>;
}
