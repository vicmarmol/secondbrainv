const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
/** "hace 5 minutos", "hace 2 horas"… */
export function timeAgo(iso: string | null, now = Date.now()) {
 if (!iso) return 'Nunca';
 const s = Math.round((Date.parse(iso) - now) / 1000);
 const abs = Math.abs(s);
 if (abs < 60) return 'hace un momento';
 if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
 if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
 return rtf.format(Math.round(s / 86400), 'day');
}
