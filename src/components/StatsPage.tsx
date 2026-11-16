import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
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

const CHART = {
  amber: '#f59e0b',
  rose: '#fb7185',
  teal: '#14b8a6',
  indigo: '#6366f1',
  sky: '#38bdf8',
  lavender: '#a78bfa',
  emerald: '#34d399',
  grid: '#e5e7eb',
};

function RomoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-gray-900/95 text-white px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-1">
        🦦 {label}
      </p>

      {payload.map((item: any) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name || item.dataKey}: {item.value}
        </p>
      ))}
    </div>
  );
}

const ChartGrid = () => (
  <CartesianGrid
    stroke={CHART.grid}
    strokeDasharray="3 6"
    vertical={false}
    opacity={0.65}
  />
);

function chartColor(
  variable: '--romo-accent' | '--romo-accent-2',
  fallback: string,
): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();

  return value || fallback;
}

export default function StatsPage() {
  const primary = chartColor('--romo-accent', CHART.amber);
  const secondary = chartColor('--romo-accent-2', CHART.teal);
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
  const Card = ({ title, children }: any) => (
    <div className="romo-card rounded-3xl p-4 shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-gray-800 text-sm">
          {title}
        </p>
        <span className="text-sm opacity-50">✨</span>
      </div>
      {children}
    </div>
  );
  return (
    <div className="space-y-4">
      <div
        className="rounded-3xl p-5 border shadow-sm"
        style={{
          background:
            'linear-gradient(135deg, var(--romo-soft), var(--romo-surface))',
          borderColor: 'var(--romo-accent)',
        }}
      >
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
        <div className="h-52">
          <ResponsiveContainer>
            <AreaChart
              data={goalActual}
              margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="checkinFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primary} stopOpacity={0.48} />
                  <stop offset="95%" stopColor={primary} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <ChartGrid />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<RomoTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="actual"
                name="Check-ins"
                stroke={primary}
                strokeWidth={3}
                fill="url(#checkinFill)"
                activeDot={{
                  r: 6,
                  fill: primary,
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
              <Line
                type="monotone"
                dataKey="goal"
                name="Daily goal"
                stroke="#94a3b8"
                strokeDasharray="5 6"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="💊 Medication adherence per month (%)">
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart
              data={medMonth}
              margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="medBars" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#fda4af" />
                </linearGradient>
              </defs>
              <ChartGrid />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<RomoTooltip />} />
              <Bar
                dataKey="pct"
                name="Adherence %"
                fill="url(#medBars)"
                radius={[12, 12, 4, 4]}
                maxBarSize={24}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="😴 Sleep vs 8h goal (avg hours per month)">
        <div className="h-52">
          <ResponsiveContainer>
            <AreaChart
              data={sleepMonth}
              margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <ChartGrid />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<RomoTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="hours"
                name="Average sleep"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#sleepFill)"
                activeDot={{
                  r: 6,
                  fill: '#6366f1',
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
              <Line
                type="monotone"
                dataKey="goal"
                name="8h goal"
                stroke="#a78bfa"
                strokeDasharray="5 6"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="🏃 Movement minutes per month">
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart
              data={moveMonth}
              margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="moveBars" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={secondary} />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <ChartGrid />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<RomoTooltip />} />
              <Bar
                dataKey="minutes"
                name="Active minutes"
                fill="url(#moveBars)"
                radius={[12, 12, 4, 4]}
                maxBarSize={24}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="💪 Movement by activity type (year total)">
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart
              data={moveByType}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            >
              <ChartGrid />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={54}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<RomoTooltip />} />
              <Bar
                dataKey="minutes"
                name="Minutes"
                fill="#a78bfa"
                radius={[0, 12, 12, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      {activeGoals.length > 0 && (
        <Card title="🌳 Active goals progress">
          <div className="space-y-2">
            {activeGoals.slice(0, 6).map(g => (
              <div key={g.id}>
                <div className="flex justify-between text-xs text-gray-600 mb-0.5"><span>{g.title}</span><span>{pctOf(g)}%</span></div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-[2px]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: pctOf(g) + '%',
                      background:
                        'linear-gradient(90deg, var(--romo-accent), var(--romo-accent-2))',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {trickCats.length > 0 && (
        <Card title="🎓 Learned tricks per category">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart
                data={trickCats}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trickBars" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor={secondary} />
                  </linearGradient>
                </defs>
                <ChartGrid />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RomoTooltip />} />
                <Bar
                  dataKey="value"
                  name="Learned"
                  fill="url(#trickBars)"
                  radius={[0, 12, 12, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      {moodCounts.length > 0 && (
        <Card title="💗 Mood distribution">
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={moodCounts}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={76}
                  paddingAngle={5}
                  cornerRadius={8}
                  stroke="none"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {moodCounts.map((m, index) => (
                    <Cell
                      key={index}
                      fill={MOOD_COLORS[m.name]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<RomoTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
