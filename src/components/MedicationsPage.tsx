import { useState } from 'react';
import { Pill, Plus, Trash2, Pencil, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

type Freq = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'interval';

interface Med {
  id: string;
  name: string;
  emoji: string;
  dose: string;
  pillsLeft: number | null;
  refillAt: number;
  start: string;
  end: string;
  freq: Freq;
  times: string[];
  weekdays: number[];
  monthDay: number;
  remind: boolean;
  note: string;
  intervalDays?: number;
}

interface Intake {
  medId: string;
  date: string;
  time: string;
  status: 'taken' | 'skipped';
  note: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const TODAY = () => fmt(new Date());
const parse = (s: string) => {
  const p = s.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
};
const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const load = <T,>(k: string, f: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : f;
  } catch {
    return f;
  }
};

const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const utcDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

const dayDiff = (a: Date, b: Date) => Math.round((utcDay(b) - utcDay(a)) / 86400000);

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

function normalizeMed(input: any): Med {
  const freq: Freq =
    input?.freq === 'interval'
      ? 'interval'
      : input?.freq === 'biweekly'
        ? 'biweekly'
        : input?.freq === 'weekly'
          ? 'weekly'
          : input?.freq === 'monthly'
            ? 'monthly'
            : 'daily';

  const times =
    Array.isArray(input?.times) && input.times.length > 0
      ? input.times
      : ['08:00'];

  const weekdays =
    Array.isArray(input?.weekdays) && input.weekdays.length > 0
      ? input.weekdays
      : [0, 1, 2, 3, 4, 5, 6];

  const refillNum = Number(input?.refillAt);

  return {
    id: input?.id ?? '',
    name: input?.name ?? '',
    emoji: input?.emoji ?? '💊',
    dose: input?.dose ?? '1 pill',
    pillsLeft: typeof input?.pillsLeft === 'number' ? input.pillsLeft : null,
    refillAt: Number.isFinite(refillNum) ? refillNum : 5,
    start: input?.start || TODAY(),
    end: input?.end || '',
    freq,
    times,
    weekdays,
    monthDay: clamp(Number(input?.monthDay) || 1, 1, 31),
    remind: Boolean(input?.remind),
    note: input?.note ?? '',
    intervalDays:
      freq === 'interval'
        ? clamp(Math.floor(Number(input?.intervalDays) || 2), 1, 365)
        : undefined,
  };
}

const blank = (): Med =>
  normalizeMed({
    id: '',
    name: '',
    emoji: '💊',
    dose: '1 pill',
    pillsLeft: null,
    refillAt: 5,
    start: TODAY(),
    end: '',
    freq: 'daily',
    times: ['08:00'],
    weekdays: [1, 2, 3, 4, 5, 6, 0],
    monthDay: 1,
    remind: false,
    note: '',
    intervalDays: 2,
  });

function scheduledOn(m: Med, s: string): boolean {
  if (!m?.start) return false;
  if (s < m.start) return false;
  if (m.end && s > m.end) return false;

  const d = parse(s);
  const start = parse(m.start);
  const diff = dayDiff(start, d);

  if (diff < 0) return false;

  switch (m.freq) {
    case 'daily':
      return true;

    case 'monthly':
      return d.getDate() === Math.min(m.monthDay, dim(d.getFullYear(), d.getMonth()));

    case 'weekly':
      return m.weekdays.includes(d.getDay());

    case 'biweekly':
      return m.weekdays.includes(d.getDay()) && Math.floor(diff / 7) % 2 === 0;

    case 'interval': {
      const n = clamp(Math.floor(m.intervalDays ?? 2), 1, 365);
      if (n <= 1) return true;
      return diff % n === 0;
    }

    default:
      return false;
  }
}

function nextOccurrences(
  m: Med,
  from: string,
  horizonDays = 45
): { date: string; times: string[] }[] {
  const fromD = parse(from);
  const startD = m.start ? parse(m.start) : fromD;

  let cursor = startD > fromD ? startD : fromD;

  const horizonEnd = addDays(fromD, Math.max(0, horizonDays - 1));
  const medEnd = m.end ? parse(m.end) : null;
  const stop = medEnd && medEnd < horizonEnd ? medEnd : horizonEnd;

  const out: { date: string; times: string[] }[] = [];

  while (cursor <= stop) {
    const s = fmt(cursor);

    if (scheduledOn(m, s)) {
      out.push({
        date: s,
        times: m.times.length ? m.times : ['08:00'],
      });
    }

    cursor = addDays(cursor, 1);
  }

  return out;
}

function syncReminders(list: Med[]) {
  const LN = (window as any).Capacitor?.Plugins?.LocalNotifications;
  if (!LN) return;

  LN.requestPermissions()
    .then(() => LN.getPending())
    .then((p: any) =>
      LN.cancel({
        notifications: (p.notifications || []).map((n: any) => ({ id: n.id })),
      })
    )
    .then(() => {
      const notifs: any[] = [];
      let id = 1;
      const MAX_NOTIFS = 100;
      const now = new Date();

      const push = (n: any) => {
        if (notifs.length >= MAX_NOTIFS) return;
        notifs.push({ ...n, id: id++ });
      };

      list
        .filter((m) => m.remind)
        .forEach((m) => {
          const times = m.times.length ? m.times : ['08:00'];

          if (m.freq === 'daily') {
            times.forEach((t) => {
              const [hh, mi] = t.split(':').map(Number);
              if (!Number.isFinite(hh) || !Number.isFinite(mi)) return;

              push({
                title: '💊 ' + m.name,
                body: 'Time for your dose (' + m.dose + ')',
                schedule: {
                  on: {
                    hour: hh,
                    minute: mi,
                  },
                  repeats: true,
                  allowWhileIdle: true,
                },
              });
            });
          } else if (m.freq === 'weekly') {
            m.weekdays.forEach((w) => {
              times.forEach((t) => {
                const [hh, mi] = t.split(':').map(Number);
                if (!Number.isFinite(hh) || !Number.isFinite(mi)) return;

                push({
                  title: '💊 ' + m.name,
                  body: 'Time for your dose (' + m.dose + ')',
                  schedule: {
                    on: {
                      weekday: w + 1,
                      hour: hh,
                      minute: mi,
                    },
                    repeats: true,
                    allowWhileIdle: true,
                  },
                });
              });
            });
          } else {
            nextOccurrences(m, TODAY(), 45).forEach(({ date, times: occTimes }) => {
              occTimes.forEach((t) => {
                const [hh, mi] = t.split(':').map(Number);
                if (!Number.isFinite(hh) || !Number.isFinite(mi)) return;

                const d = parse(date);
                const when = new Date(
                  d.getFullYear(),
                  d.getMonth(),
                  d.getDate(),
                  hh,
                  mi
                );

                if (when <= now) return;

                push({
                  title: '💊 ' + m.name,
                  body: 'Time for your dose (' + m.dose + ')',
                  schedule: {
                    on: {
                      year: d.getFullYear(),
                      month: d.getMonth() + 1,
                      day: d.getDate(),
                      hour: hh,
                      minute: mi,
                    },
                    repeats: false,
                    allowWhileIdle: true,
                  },
                });
              });
            });
          }
        });

      if (notifs.length) {
        LN.schedule({ notifications: notifs });
      }
    })
    .catch(() => {});
}

export default function MedicationsPage() {
  const [meds, setMeds] = useState<Med[]>(() =>
    load('romo-meds-v2', [] as Med[]).map(normalizeMed)
  );

  const [intakes, setIntakes] = useState<Intake[]>(() =>
    load('romo-intakes-v2', [] as Intake[])
  );

  const now = new Date();

  const [ym, setYm] = useState({
    y: now.getFullYear(),
    m: now.getMonth(),
  });

  const [selected, setSelected] = useState(TODAY());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Med>(blank());
  const [editingId, setEditingId] = useState<string | null>(null);

  const persistMeds = (next: Med[]) => {
    const clean = next.map(normalizeMed);
    setMeds(clean);
    save('romo-meds-v2', clean);
    syncReminders(clean);
  };

  const persistIntakes = (next: Intake[]) => {
    setIntakes(next);
    save('romo-intakes-v2', next);
  };

  const get = (medId: string, date: string, time: string) =>
    intakes.find((i) => i.medId === medId && i.date === date && i.time === time);

  const setStatus = (
    m: Med,
    date: string,
    time: string,
    status: 'taken' | 'skipped' | null
  ) => {
    const old = get(m.id, date, time);
    const oldTaken = old?.status === 'taken' ? 1 : 0;
    const newTaken = status === 'taken' ? 1 : 0;

    let next = intakes.filter(
      (i) => !(i.medId === m.id && i.date === date && i.time === time)
    );

    if (status) {
      next = [
        {
          medId: m.id,
          date,
          time,
          status,
          note: old?.note || '',
        },
        ...next,
      ];
    }

    persistIntakes(next);

    if (m.pillsLeft !== null && oldTaken !== newTaken) {
      persistMeds(
        meds.map((x) =>
          x.id === m.id
            ? {
                ...x,
                pillsLeft: Math.max(0, (x.pillsLeft || 0) + oldTaken - newTaken),
              }
            : x
        )
      );
    }
  };

  const setNote = (m: Med, date: string, time: string, note: string) => {
    persistIntakes(
      intakes.map((i) =>
        i.medId === m.id && i.date === date && i.time === time
          ? { ...i, note }
          : i
      )
    );
  };

  const cells: (string | null)[] = (() => {
    const offset = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
    const arr: (string | null)[] = Array(offset).fill(null);

    for (let d = 1; d <= dim(ym.y, ym.m); d++) {
      arr.push(fmt(new Date(ym.y, ym.m, d)));
    }

    while (arr.length % 7) arr.push(null);

    return arr;
  })();

  const monthStats = meds.map((m) => {
    let sched = 0;
    let taken = 0;

    const last =
      ym.y === now.getFullYear() && ym.m === now.getMonth()
        ? now.getDate()
        : dim(ym.y, ym.m);

    for (let d = 1; d <= last; d++) {
      const s = fmt(new Date(ym.y, ym.m, d));

      if (!scheduledOn(m, s)) continue;

      m.times.forEach((t) => {
        sched++;

        if (get(m.id, s, t)?.status === 'taken') {
          taken++;
        }
      });
    }

    return {
      m,
      sched,
      taken,
      pct: sched ? Math.round((100 * taken) / sched) : 0,
    };
  });

  const totS = monthStats.reduce((a, s) => a + s.sched, 0);
  const totT = monthStats.reduce((a, s) => a + s.taken, 0);
  const monthPct = totS ? Math.round((100 * totT) / totS) : 0;

  const todayStr = TODAY();
  const yearEnd = todayStr.startsWith(String(ym.y))
    ? todayStr
    : `${ym.y}-12-31`;

  let ySched = 0;
  let yTaken = 0;

  let loopDate = parse(`${ym.y}-01-01`);
  const endLoopDate = parse(yearEnd);

  while (loopDate <= endLoopDate) {
    const s = fmt(loopDate);

    meds.forEach((m) => {
      if (!scheduledOn(m, s)) return;

      m.times.forEach((t) => {
        ySched++;

        if (get(m.id, s, t)?.status === 'taken') {
          yTaken++;
        }
      });
    });

    loopDate = addDays(loopDate, 1);
  }

  const yearPct = ySched ? Math.round((100 * yTaken) / ySched) : 0;

  const dayMeds = meds.filter((m) => scheduledOn(m, selected));

  const submitForm = () => {
    const clean = normalizeMed(form);

    if (!clean.name.trim() || !clean.times.length) return;

    if (editingId) {
      persistMeds(
        meds.map((m) =>
          m.id === editingId
            ? {
                ...clean,
                id: editingId,
              }
            : m
        )
      );
    } else {
      persistMeds([
        ...meds,
        {
          ...clean,
          id: uid(),
        },
      ]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(blank());
  };

  const freqLabel = (m: Med) => {
    const times = m.times.length || 1;

    switch (m.freq) {
      case 'daily':
        return `${times}×/day`;

      case 'weekly':
        return `${times}×/wk on ${m.weekdays.length} days`;

      case 'biweekly':
        return `${times}× every 2 wks`;

      case 'monthly':
        return `${times}× day ${m.monthDay}/month`;

      case 'interval': {
        const n = clamp(Math.floor(m.intervalDays ?? 2), 1, 365);

        if (n === 2) {
          return `${times}× every other day`;
        }

        return `${times}× every ${n} days`;
      }

      default:
        return `${times}×/day`;
    }
  };

  const currentInterval = clamp(Math.floor(form.intervalDays ?? 2), 1, 365);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() =>
              setYm(({ y, m }) =>
                m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }
              )
            }
            className="text-gray-400"
          >
            <ChevronLeft size={18} />
          </button>

          <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Pill size={16} className="text-rose-500" />
            {new Date(ym.y, ym.m, 1).toLocaleString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </p>

          <button
            onClick={() =>
              setYm(({ y, m }) =>
                m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }
              )
            }
            className="text-gray-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              This Month
            </p>
            <p className="text-lg font-bold text-rose-500">{monthPct}%</p>
          </div>

          <div className="bg-gray-50 p-2 rounded-lg text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              This Year
            </p>
            <p className="text-lg font-bold text-indigo-500">{yearPct}%</p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((s, i) => {
            if (!s) return <span key={i} />;

            const dots = meds
              .filter((m) => scheduledOn(m, s))
              .slice(0, 4)
              .map((m) => {
                const st = m.times.map((t) => get(m.id, s, t)?.status);

                if (st.every((x) => x === 'taken')) return 'bg-emerald-400';
                if (st.some((x) => x === 'taken')) return 'bg-amber-400';

                return s < TODAY() ? 'bg-pink-300' : 'bg-gray-300';
              });

            return (
              <button
                key={i}
                onClick={() => setSelected(s)}
                className={
                  'rounded-lg py-1 flex flex-col items-center gap-0.5 border ' +
                  (selected === s
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-transparent hover:bg-gray-50')
                }
              >
                <span
                  className={
                    'text-xs ' +
                    (s === TODAY() ? 'font-bold text-rose-600' : 'text-gray-600')
                  }
                >
                  {parse(s).getDate()}
                </span>

                <span className="flex gap-0.5 h-1.5">
                  {dots.map((c, j) => (
                    <span
                      key={j}
                      className={'w-1.5 h-1.5 rounded-full ' + c}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {monthStats.map(({ m, pct }) => (
            <span
              key={m.id}
              className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600"
            >
              {m.emoji} {m.name} {pct}%
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <p className="font-semibold text-gray-800 text-sm">
          {parse(selected).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </p>

        {dayMeds.length === 0 && (
          <p className="text-gray-400 text-xs">
            Nothing scheduled this day. 🌿
          </p>
        )}

        {dayMeds.map((m) => (
          <div
            key={m.id}
            className="border border-gray-100 rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">
                {m.emoji} {m.name}{' '}
                <span className="text-xs text-gray-400">• {m.dose}</span>
              </p>

              {m.pillsLeft !== null && (
                <span
                  className={
                    'text-[10px] px-2 py-0.5 rounded-full ' +
                    (m.pillsLeft <= m.refillAt
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500')
                  }
                >
                  {m.pillsLeft} left
                  {m.pillsLeft <= m.refillAt ? ' • refill!' : ''}
                </span>
              )}
            </div>

            {m.times.map((t) => {
              const it = get(m.id, selected, t);

              return (
                <div key={t} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12">{t}</span>

                    <button
                      onClick={() =>
                        setStatus(
                          m,
                          selected,
                          t,
                          it?.status === 'taken' ? null : 'taken'
                        )
                      }
                      className={
                        'px-2 py-1 rounded-lg text-xs flex items-center gap-1 border ' +
                        (it?.status === 'taken'
                          ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500')
                      }
                    >
                      <Check size={12} /> taken
                    </button>

                    <button
                      onClick={() =>
                        setStatus(
                          m,
                          selected,
                          t,
                          it?.status === 'skipped' ? null : 'skipped'
                        )
                      }
                      className={
                        'px-2 py-1 rounded-lg text-xs border ' +
                        (it?.status === 'skipped'
                          ? 'bg-pink-100 border-pink-200 text-pink-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500')
                      }
                    >
                      skipped
                    </button>
                  </div>

                  {it && (
                    <input
                      value={it.note}
                      onChange={(e) =>
                        setNote(m, selected, t, e.target.value)
                      }
                      placeholder="Personal note for this intake…"
                      className="w-full px-2 py-1 text-xs rounded border border-gray-100 bg-gray-50"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-800 text-sm">
            My medications
          </p>

          <button
            onClick={() => {
              setForm(blank());
              setEditingId(null);
              setShowForm(true);
            }}
            className="text-rose-500 text-xs flex items-center gap-1"
          >
            <Plus size={12} /> Add
          </button>
        </div>

        {meds.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between border border-gray-100 rounded-xl px-3 py-2"
          >
            <div>
              <p className="text-sm text-gray-800">
                {m.emoji} {m.name}
              </p>

              <p className="text-[10px] text-gray-400">
                {freqLabel(m)} • {m.start}
                {m.end ? ' → ' + m.end : ''}
                {m.remind ? ' • 🔔' : ''}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setForm(m);
                  setEditingId(m.id);
                  setShowForm(true);
                }}
                className="text-gray-300 hover:text-gray-500"
              >
                <Pencil size={14} />
              </button>

              <button
                onClick={() => {
                  persistMeds(meds.filter((x) => x.id !== m.id));
                  persistIntakes(intakes.filter((i) => i.medId !== m.id));
                }}
                className="text-gray-300 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {showForm && (
          <div className="border border-rose-100 rounded-xl p-3 space-y-2 bg-rose-50/40">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">
                {editingId ? 'Edit' : 'New'} medication
              </p>

              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-[64px_1fr] gap-2">
              <input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="px-2 py-2 rounded-lg border border-gray-200 text-center"
              />

              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Name (e.g. Ibuprofen 500 mg)"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.dose}
                onChange={(e) => setForm({ ...form, dose: e.target.value })}
                placeholder="Dose (1 pill)"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />

              <input
                type="number"
                value={form.pillsLeft ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pillsLeft:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="Pills left (optional)"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-500">
                From
                <input
                  type="date"
                  value={form.start}
                  onChange={(e) =>
                    setForm({ ...form, start: e.target.value })
                  }
                  className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </label>

              <label className="text-xs text-gray-500">
                Until (optional)
                <input
                  type="date"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </label>
            </div>

            <select
              value={form.freq}
              onChange={(e) => {
                const freq = e.target.value as Freq;

                setForm({
                  ...form,
                  freq,
                  intervalDays:
                    freq === 'interval'
                      ? form.intervalDays ?? 2
                      : form.intervalDays,
                });
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="daily">Every day</option>
              <option value="interval">Every X days (custom interval)</option>
              <option value="weekly">Weekly (pick days)</option>
              <option value="biweekly">Bi-weekly (every 2 weeks)</option>
              <option value="monthly">Monthly (pick day)</option>
            </select>

            {form.freq === 'interval' && (
              <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs font-medium text-gray-600">
                  Custom interval
                </p>

                <div className="flex flex-wrap gap-2">
                  {[2, 3, 4, 5, 7, 14, 30].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          intervalDays: n,
                        })
                      }
                      className={
                        'rounded-lg border px-2 py-1 text-xs ' +
                        (currentInterval === n
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
                      }
                    >
                      {n === 2
                        ? 'Every other day'
                        : n === 7
                          ? 'Every 7 days'
                          : n === 14
                            ? 'Every 14 days'
                            : n === 30
                              ? 'Every 30 days'
                              : `Every ${n} days`}
                    </button>
                  ))}
                </div>

                <label className="block text-xs text-gray-500">
                  Every
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={currentInterval}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        intervalDays: clamp(
                          Math.floor(Number(e.target.value) || 2),
                          1,
                          365
                        ),
                      })
                    }
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                  day(s)
                </label>

                <p className="text-[10px] text-gray-500">
                  Anchored to start date: {form.start || TODAY()} • Preview:{' '}
                  {freqLabel(normalizeMed(form))}
                </p>
              </div>
            )}

            {(form.freq === 'weekly' || form.freq === 'biweekly') && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  {form.freq === 'biweekly'
                    ? 'Pick days. These happen every other week from the start date.'
                    : 'Pick days of the week.'}
                </p>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          weekdays: form.weekdays.includes(d)
                            ? form.weekdays.filter((x) => x !== d)
                            : [...form.weekdays, d],
                        })
                      }
                      className={
                        'w-8 h-8 rounded-lg text-xs border ' +
                        (form.weekdays.includes(d)
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white text-gray-500 border-gray-200')
                      }
                    >
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][d]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.freq === 'monthly' && (
              <input
                type="number"
                min={1}
                max={31}
                value={form.monthDay}
                onChange={(e) =>
                  setForm({
                    ...form,
                    monthDay: clamp(Number(e.target.value) || 1, 1, 31),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                placeholder="Day of month"
              />
            )}

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Times of day</p>

              {form.times.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="time"
                    value={t}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        times: form.times.map((x, j) =>
                          j === i ? e.target.value : x
                        ),
                      })
                    }
                    className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        times: form.times.filter((_, j) => j !== i),
                      })
                    }
                    className="text-gray-300 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    times: [...form.times, '08:00'],
                  })
                }
                className="text-rose-500 text-xs"
              >
                + add time
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.remind}
                onChange={(e) =>
                  setForm({ ...form, remind: e.target.checked })
                }
              />
              🔔 Reminder alarms (on phone)
            </label>

            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Personal note (e.g. pain-killer for period cramps)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />

            <button
              type="button"
              onClick={submitForm}
              className="w-full bg-rose-500 text-white py-2 rounded-xl text-sm"
            >
              Save 💾
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
