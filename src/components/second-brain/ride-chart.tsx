import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRides } from '@/services';
import type { RideWeek } from '@/types/second-brain';
export function RideChart() {
 const [rows, setRows] = useState<RideWeek[]>([]);
 useEffect(() => { let active = true; getRides().then(data => { if (active) setRows(data); }); return () => { active = false; }; }, []);
 if (!rows.length) return <p className="text-sm text-muted-foreground">Cargando tus salidas…</p>;
 return <div className="chart-box"><h3 className="chart-title">Kilómetros por semana</h3><ResponsiveContainer width="100%" height={200}><BarChart data={rows} barGap={8} margin={{ left: -20, right: 10, top: 10 }}><CartesianGrid stroke="var(--border)" vertical={false}/><XAxis dataKey="week" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: 'var(--background)', borderColor: 'var(--border)', borderRadius: 6, fontSize: 11 }} cursor={{ fill: 'var(--muted)' }}/><Bar dataKey="previous" name="Octubre (km)" fill="var(--border)" radius={[4,4,0,0]} maxBarSize={45}/><Bar dataKey="current" name="Noviembre (km)" fill="var(--primary)" radius={[4,4,0,0]} maxBarSize={45}/></BarChart></ResponsiveContainer><div className="chart-legend"><span><i className="legend-previous"/>Octubre</span><span><i className="legend-current"/>Noviembre</span></div><table className="ride-table"><thead><tr><th>Periodo</th><th>Octubre</th><th>Noviembre</th></tr></thead><tbody>{rows.map(row => <tr key={row.week}><td>{row.week}</td><td>{row.previous} km</td><td>{row.current} km</td></tr>)}<tr><td>Total comparable</td><td>190 km</td><td>250 km</td></tr></tbody></table></div>;
}
