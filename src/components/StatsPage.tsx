import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Freq = 'daily' | 'weekly' | 'biweekly' | 'monthly';
interface Med { id: string; name: string; emoji: string; dose: string; pillsLeft: number | null; refillAt: number; start: string; end: string; freq: Freq; times: string[]; weekdays: number[]; monthDay: number; remind: boolean; note: string; }
interface Intake { medId: string; date: string; time: string; status: 'taken' | 'skipped'; note: string; }
interface TreeNode { id: string; title: string; status: string; children: TreeNode[]; }
interface GoalRoot extends TreeNode { board: string; }
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s: string) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const load = <T,>(k: string, f: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : f; } catch { return f; } };
function scheduledOn(m: Med, s: string): boolean {
  if (s < m.start || (m.end && s > m.end)) return false;
  const d = parse(s);
  if (m.freq === 'daily') return true;
  if (m.freq === 'monthly') return d.getDate() === Math.min(m.monthDay, dim(d.getFullYear(), d.getMonth()));
  if (!m.weekdays.includes(d.getDay())) return false;
  if (m.freq === 'weekly') return true;
  return Math.floor((d.getTime() - parse(m.start).getTime()) / 604800000) % 2 === 0;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MOOD_COLORS: Record<string, string> = { great: '#4ade80', good: '#34d399', okay: '#facc15', low: '#fb923c', bad: '#f87171' };
const WEIGHT: Record<string, number> = { unknown: 0, learning: 0.5, known: 1 };
function nodeStats(n: TreeNode): { score: number; total: number } {
  if (!n.children.length) return { score: WEIGHT[n.status] ?? 0, total: 1 };
  return n.children.reduce((a, c) => { const s = nodeStats(c); return { score: a.score + s.score, total: a.total + s.total }; }, { score: 0, total: 0 });
}
const pctOf = (n: TreeNode) => { const s = nodeStats(n); return s.total ? Math.round((100 * s.score) / s.total) : 0; };
const countKnown = (n: TreeNode): number => (!n.children.length ? (n.status === 'known' ? 1 : 0) : n.children.reduce((a, c) => a + countKnown(c), 0));

export default function StatsPage() {
  const now = new Date(); const nowY = now.getFullYear();
  const [year, setYear] = useState(nowY);
  const meds = load<Med[]>('romo-meds-v2', []);
  const intakes = load<Intake[]>('romo-intakes-v2', []);
  const checkIns = load<any[]>('romo-checkins', []);
  const sleepLogs = load<any[]>('romo-sleep', []);
  const movements = load<any[]>('romo-movements', []);
  const goalRoots = load<GoalRoot[]>('romo-goals-board', []);
  const trickRoots = load<TreeNode[]>('romo-trick-tree', []);
  const get = (id: string, d: string, t: string) => intakes.find(i => i.medId === id && i.date === d && i.time === t);
  const yPrefix = String(year);
  let ySched = 0, yTaken = 0;
  const medMonth = MONTHS.map((name, mi) => {
    let sched = 0, taken = 0;
    const last = (year === nowY && mi === now.getMonth()) ? now.getDate() : (year > nowY ? 0 : dim(year, mi));
    for (let d = 1; d <= last; d++) { const s = fmt(new Date(year, mi, d)); meds.forEach(m => { if (!scheduledOn(m, s)) return; m.times.forEach(t => { sched++; if (get(m.id, s, t)?.status === 'taken') taken++; }); }); }
    ySched += sched; yTaken += taken;
    return { name, pct: sched ? Math.round((100 * taken) / sched) : 0 };
  });
  const yearPct = ySched ? Math.round((100 * yTaken) / ySched) : 0;
  const goalActual = MONTHS.map((name, mi) => {
    const last = (year === nowY && mi === now.getMonth()) ? now.getDate() : (year > nowY ? 0 : dim(year, mi));
    return { name, goal: last, actual: checkIns.filter(c => c.date && c.date.startsWith(yPrefix + '-' + pad(mi + 1))).length };
  });
  const sleepMonth = MONTHS.map((name, mi) => {
    const logs = sleepLogs.filter(l => l.date && l.date.startsWith(yPrefix + '-' + pad(mi + 1)));
    const hrs = logs.map(l => { const b = (l.bedtime || '0:0').split(':').map(Number); const w = (l.wakeTime || '0:0').split(':').map(Number); return (((w[0] * 60 + w[1]) - (b[0] * 60 + b[1]) + 1440) % 1440) / 60; });
    return { name, hours: hrs.length ? Math.round((hrs.reduce((a, b) => a + b, 0) / hrs.length) * 10) / 10 : 0, goal: 8 };
  });
  const moveMonth = MONTHS.map((name, mi) => ({ name, minutes: movements.filter(m => m.date && m.date.startsWith(yPrefix + '-' + pad(mi + 1))).reduce((a, m) => a + (m.duration || 0), 0) }));
  const moveByType = ['stretch', 'walk', 'yoga', 'dance', 'other'].map(t => ({ name: t, minutes: movements.filter(m => m.date && m.date.startsWith(yPrefix) && m.type === t).reduce((a, m) => a + (m.duration || 0), 0) }));
  const moodCounts = ['great', 'good', 'okay', 'low', 'bad'].map(mood => ({ name: mood, value: checkIns.filter(c => c.mood === mood && c.date && c.date.startsWith(yPrefix)).length })).filter(x => x.value > 0);
  const trickCats = trickRoots.map(r => ({ name: r.title.length > 12 ? r.title.slice(0, 12) + '…' : r.title, value: countKnown(r) })).filter(x => x.value > 0);
  const learnedTotal = trickRoots.reduce((a, r) => a + countKnown(r), 0);
  const activeGoals = goalRoots.filter(r => r.board === 'active');
  const streak = (() => { let c = 0; for (let i = 0; ; i++) { const s = fmt(new Date(Date.now() - i * 86400000)); if (checkIns.some(x => x.date === s)) c++; else break; } return c; })();
  const heatCells = (() => {
    const start = new Date(year, 0, 1);
    const offset = (start.getDay() + 6) % 7;
    const cells: (string | null)[] = Array(offset).fill(null);
    const end = new Date(year, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) cells.push(fmt(new Date(d)));
    while (cells.length % 7) cells.push(null);
    return cells;
  })();
  const heatVal = (s: string) => {
    const dayMeds = meds.filter(m => scheduledOn(m, s));
    return (checkIns.some(c => c.date === s) ? 1 : 0) + (movements.some(m => m.date === s) ? 1 : 0) + (dayMeds.length && dayMeds.every(m => m.times.every(t => get(m.id, s, t)?.status === 'taken')) ? 1 : 0);
  };
  const heatCls = (v: number) => (v === 0 ? 'bg-gray-100' : v === 1 ? 'bg-teal-200' : v === 2 ? 'bg-teal-400' : 'bg-teal-600');
  const Card = ({ title, children }: any) => (<div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"><p className="font-semibold text-gray-800 text-sm mb-2">{title}</p>{children}</div>);
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-2xl p-5 border border-teal-200">
        <div className="flex items-center justify-between">
          <button onClick={() => setYear(y => y - 1)} className="text-teal-600"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-semibold text-teal-800">📊 Scoreboard — {year}</h2>
          <button onClick={() => setYear(y => Math.min(nowY, y + 1))} className={'text-teal-600 ' + (year >= nowY ? 'opacity-30' : '')}><ChevronRight size={20} /></button>
        </div>
        <p className="text-xs text-teal-700 mt-1">Your whole year at a glance — goals, habits, sleep, movement & meds.</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100"><p className="text-lg font-bold text-rose-500">{yearPct}%</p><p className="text-[10px] text-gray-500">Meds taken</p></div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100"><p className="text-lg font-bold text-amber-500">{streak}</p><p className="text-[10px] text-gray-500">Day streak</p></div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100"><p className="text-lg font-bold text-indigo-500">{checkIns.filter(c => c.date && c.date.startsWith(yPrefix)).length}</p><p className="text-[10px] text-gray-500">Check-ins</p></div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100"><p className="text-lg font-bold text-emerald-500">{learnedTotal}</p><p className="text-[10px] text-gray-500">Tricks learned</p></div>
      </div>
      <Card title="🗓️ Year heatmap — check-ins + movement + meds">
        <div className="overflow-x-auto pb-1">
          <div className="grid gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 10px)', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(' + Math.ceil(heatCells.length / 7) + ', 10px)' }}>
            {heatCells.map((s, i) => (<div key={i} title={s || ''} className={'rounded-[2px] ' + (s ? heatCls(heatVal(s)) : 'bg-transparent')} style={{ width: 10, height: 10 }} />))}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">less <span className="w-2.5 h-2.5 rounded-[2px] bg-gray-100 inline-block" /><span className="w-2.5 h-2.5 rounded-[2px] bg-teal-200 inline-block" /><span className="w-2.5 h-2.5 rounded-[2px] bg-teal-400 inline-block" /><span className="w-2.5 h-2.5 rounded-[2px] bg-teal-600 inline-block" /> more</div>
      </Card>
      <Card title="🎯 Check-ins: goal vs actual (per month)">
        <div className="h-44"><ResponsiveContainer><LineChart data={goalActual}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} /><Line type="monotone" dataKey="goal" name="Goal (daily check-in)" stroke="#94a3b8" strokeDasharray="6 6" dot={false} /><Line type="monotone" dataKey="actual" name="Actual" stroke="#f59e0b" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
      </Card>
      <Card title="💊 Medication adherence per month (%)">
        <div className="h-44"><ResponsiveContainer><BarChart data={medMonth}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="pct" fill="#fb7185" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </Card>
      <Card title="😴 Sleep vs 8h goal (avg hours per month)">
        <div className="h-44"><ResponsiveContainer><LineChart data={sleepMonth}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} /><Line type="monotone" dataKey="goal" name="Goal" stroke="#94a3b8" strokeDasharray="6 6" dot={false} /><Line type="monotone" dataKey="hours" name="Actual" stroke="#818cf8" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
      </Card>
      <Card title="🏃 Movement minutes per month">
        <div className="h-44"><ResponsiveContainer><BarChart data={moveMonth}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="minutes" fill="#2dd4bf" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </Card>
      <Card title="💪 Movement by activity type (year total)">
        <div className="h-44"><ResponsiveContainer><BarChart data={moveByType}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="minutes" fill="#a78bfa" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </Card>
      {activeGoals.length > 0 && (
        <Card title="🌳 Active goals progress">
          <div className="space-y-2">
            {activeGoals.slice(0, 6).map(g => (
              <div key={g.id}>
                <div className="flex justify-between text-xs text-gray-600 mb-0.5"><span>{g.title}</span><span>{pctOf(g)}%</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-400 rounded-full" style={{ width: pctOf(g) + '%' }} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {trickCats.length > 0 && (
        <Card title="🎓 Learned tricks per category">
          <div className="h-44"><ResponsiveContainer><BarChart data={trickCats}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
      )}
      {moodCounts.length > 0 && (
        <Card title="💗 Mood distribution">
          <div className="h-44"><ResponsiveContainer><PieChart><Pie data={moodCounts} dataKey="value" nameKey="name" outerRadius={60} label={{ fontSize: 10 }}>{moodCounts.map((m, i) => (<Cell key={i} fill={MOOD_COLORS[m.name]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </Card>
      )}
    </div>
  );
}
