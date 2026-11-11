import { Filesystem, Directory } from '@capacitor/filesystem';

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s: string) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
function scheduledOn(m: any, s: string): boolean {
  if (s < m.start || (m.end && s > m.end)) return false;
  const d = parse(s);
  if (m.freq === 'daily') return true;
  if (m.freq === 'monthly') return d.getDate() === Math.min(m.monthDay, dim(d.getFullYear(), d.getMonth()));
  if (!m.weekdays.includes(d.getDay())) return false;
  if (m.freq === 'weekly') return true;
  return Math.floor((d.getTime() - parse(m.start).getTime()) / 604800000) % 2 === 0;
}
const WEIGHT: Record<string, number> = { unknown: 0, learning: 0.5, known: 1 };
function stats(n: any): { score: number; total: number } {
  if (!n.children || !n.children.length) return { score: WEIGHT[n.status] || 0, total: 1 };
  return n.children.reduce((a: any, c: any) => { const s = stats(c); return { score: a.score + s.score, total: a.total + s.total }; }, { score: 0, total: 0 });
}
const pctOf = (n: any) => { const s = stats(n); return s.total ? Math.round((100 * s.score) / s.total) : 0; };

export async function syncWidget() {
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  try {
    const roots = JSON.parse(localStorage.getItem('romo-goals-board') || '[]');
    const goals = roots.filter((r: any) => r.board === 'active').slice(0, 3).map((r: any) => ({ title: r.title, pct: pctOf(r) }));
    const checkIns = JSON.parse(localStorage.getItem('romo-checkins') || '[]');
    let streak = 0;
    for (let i = 0; ; i++) { const s = fmt(new Date(Date.now() - i * 86400000)); if (checkIns.some((c: any) => c.date === s)) streak++; else break; }
    const meds = JSON.parse(localStorage.getItem('romo-meds-v2') || '[]');
    const intakes = JSON.parse(localStorage.getItem('romo-intakes-v2') || '[]');
    let sched = 0, taken = 0;
    for (let i = 0; i < 7; i++) {
      const s = fmt(new Date(Date.now() - i * 86400000));
      meds.forEach((m: any) => {
        if (!scheduledOn(m, s)) return;
        m.times.forEach((t: string) => { sched++; if (intakes.some((x: any) => x.medId === m.id && x.date === s && x.time === t && x.status === 'taken')) taken++; });
      });
    }
    const snapshot = { goals, streak, medPct: sched ? Math.round((100 * taken) / sched) : 0, updated: fmt(new Date()) };
    await Filesystem.writeFile({ path: 'widget-snapshot.json', data: JSON.stringify(snapshot), directory: Directory.Documents, recursive: true });
  } catch { /* ignore */ }
}
