import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getSyncHealthConnections } from '@/services/sync-status';
import { syncHealth } from '@/lib/sync-status';
import { timeAgo } from '@/lib/relative-time';

export function SyncIndicator() {
 const navigate = useNavigate();
 const [open, setOpen] = useState(false);
 const q = useQuery({ queryKey: ['sync-health'], queryFn: () => getSyncHealthConnections(), refetchInterval: query => (query.state.data?.some(c => c.running) ? 5000 : 30000), refetchOnWindowFocus: true });
 const conns = q.data ?? [];
 const health = q.data ? syncHealth(conns) : { kind: 'none' as const, label: 'Comprobando…' };
 function click() {
  if (window.matchMedia('(hover: none)').matches && !open) { setOpen(true); return; }
  navigate({ to: '/conexiones' });
 }
 return <div className="sync-indicator" data-open={open} onMouseLeave={() => setOpen(false)}>
  <button type="button" className="sync-indicator-btn" data-kind={health.kind} onClick={click} aria-label={`Estado de sincronización: ${health.label}. Ir a Conexiones`}><span className="status-dot"/><span>{health.label}</span></button>
  <div className="sync-detail" role="tooltip">
   {conns.length ? conns.map(c => <div key={c.id} className="sync-detail-row"><strong>{c.name}</strong><span>{c.failed ? 'Requiere atención · ' : c.running ? 'Sincronizando · ' : ''}{c.lastOk ? `${timeAgo(c.lastOk)} (${c.lastOkTrigger === 'automatica' ? 'automática' : 'manual'})` : 'Sin sincronizaciones correctas'}</span></div>) : <div className="sync-detail-row"><span>No hay conexiones activas.</span></div>}
   <button type="button" className="sync-detail-link" onClick={() => navigate({ to: '/conexiones' })}>Ir a Conexiones →</button>
  </div>
 </div>;
}
