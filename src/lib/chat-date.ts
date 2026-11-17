export type DatePeriod = 'week' | 'month' | 'previous_week' | null;

export function dateIntent(question: string): { period: DatePeriod } | null {
 const text = question.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
 const period: DatePeriod = /\b(?:la )?semana pasada\b/.test(text) ? 'previous_week' : /\besta semana\b/.test(text) ? 'week' : /\beste mes\b/.test(text) ? 'month' : null;
 return period || /\b(ultim\w*|recient\w*|nuev\w*|actualiz\w*|editad\w*|modificad\w*)\b/.test(text) ? { period } : null;
}

/** Calendar periods use Europe/Madrid, Monday-start weeks and an exclusive end. */
export function periodBounds(period: DatePeriod, now = new Date()) {
 if (!period) return {};
 const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
 const date = new Date(`${day}T00:00:00Z`);
 let start = new Date(date); let end = new Date(date);
 if (period === 'month') { start.setUTCDate(1); end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1); }
 else {
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  if (period === 'previous_week') start.setUTCDate(start.getUTCDate() - 7);
  end = new Date(start); end.setUTCDate(end.getUTCDate() + 7);
 }
 const midnight = (d: Date) => {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(d));
  return new Date(d.getTime() - hour * 3600000).toISOString();
 };
 return { period_start: midnight(start), period_end: midnight(end) };
}