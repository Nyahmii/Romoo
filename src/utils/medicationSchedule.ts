export type Freq = 'daily' | 'weekly' | 'monthly' | 'interval';

export interface Med {
  id: string;
  name: string;
  emoji: string;
  dose: string;
  pillsLeft: number | null;
  refillAt: number;
  start: string; // yyyy-MM-dd
  end: string;   // yyyy-MM-dd or empty
  freq: Freq;
  times: string[]; // ["08:00", "20:00"]
  weekdays: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  monthDay: number;
  remind: boolean;
  note: string;
  intervalDays?: number; // used when freq === 'interval'
}

export interface Occurrence {
  date: string;
  times: string[];
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return dateToStr(new Date());
}

export function strToDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function utcDayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((utcDayNumber(b) - utcDayNumber(a)) / 86400000);
}

export function normalizeFreq(value: unknown): Freq {
  if (value === 'weekly') return 'weekly';
  if (value === 'monthly') return 'monthly';
  if (value === 'interval') return 'interval';
  return 'daily';
}

export function normalizeIntervalDays(value: unknown): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;

  const floored = Math.floor(n);

  // intervalDays only matters for freq === 'interval'
  // Every 1 day is effectively daily, but we still allow it safely.
  return Math.min(365, Math.max(1, floored));
}

export function normalizeMed(input: Partial<Med> & Record<string, any>): Med {
  const freq = normalizeFreq(input.freq);
  const intervalDays = freq === 'interval'
    ? normalizeIntervalDays(input.intervalDays ?? 2) ?? 2
    : undefined;

  return {
    id: input.id || '',
    name: input.name || 'Medication',
    emoji: input.emoji || '💊',
    dose: input.dose || '1 pill',
    pillsLeft:
      typeof input.pillsLeft === 'number'
        ? input.pillsLeft
        : input.pillsLeft === null
          ? null
          : null,
    refillAt: Number(input.refillAt ?? 5),
    start: input.start || todayStr(),
    end: input.end || '',
    freq,
    times:
      Array.isArray(input.times) && input.times.length > 0
        ? input.times
        : ['08:00'],
    weekdays:
      Array.isArray(input.weekdays) && input.weekdays.length > 0
        ? input.weekdays
        : [0, 1, 2, 3, 4, 5, 6],
    monthDay: Number(input.monthDay ?? 1),
    remind: Boolean(input.remind),
    note: input.note || '',
    intervalDays,
  };
}

export function blankMed(): Med {
  return normalizeMed({
    id: '',
    name: '',
    emoji: '💊',
    dose: '1 pill',
    pillsLeft: null,
    refillAt: 5,
    start: todayStr(),
    end: '',
    freq: 'daily',
    times: ['08:00'],
    weekdays: [1, 2, 3, 4, 5, 6, 0],
    monthDay: 1,
    remind: false,
    note: '',
    intervalDays: 2,
  });
}

/**
 * Returns true if the medication is scheduled on the given yyyy-MM-dd date.
 *
 * Interval behavior:
 * - Anchored to m.start
 * - Example: start = 2026-11-12, intervalDays = 2
 *   Scheduled dates: 2026-11-12, 2026-11-14, 2026-11-16, ...
 */
export function scheduledOn(m: Med, s: string): boolean {
  if (!m?.start) return false;
  if (s < m.start) return false;
  if (m.end && s > m.end) return false;

  const target = strToDate(s);
  const start = strToDate(m.start);

  switch (m.freq) {
    case 'daily':
      return true;

    case 'weekly':
      return m.weekdays.includes(target.getDay());

    case 'monthly':
      return target.getDate() === m.monthDay;

    case 'interval': {
      const interval = Math.max(1, Math.floor(m.intervalDays ?? 2));

      if (interval <= 1) return true;

      const diff = daysBetween(start, target);
      return diff >= 0 && diff % interval === 0;
    }

    default:
      return false;
  }
}

/**
 * Get upcoming scheduled occurrences for notification scheduling.
 *
 * Default horizon is 30 days to avoid scheduling too many notifications.
 */
export function nextOccurrences(
  m: Med,
  from: string = todayStr(),
  horizonDays = 30
): Occurrence[] {
  const fromDate = strToDate(from);
  const startDate = strToDate(m.start || from);

  let cursor = startDate > fromDate ? startDate : fromDate;

  const horizonEnd = addDays(fromDate, Math.max(0, horizonDays - 1));
  const medEnd = m.end ? strToDate(m.end) : null;

  const stopDate = medEnd && medEnd < horizonEnd ? medEnd : horizonEnd;

  const out: Occurrence[] = [];

  while (cursor <= stopDate) {
    const ds = dateToStr(cursor);

    if (scheduledOn(m, ds)) {
      out.push({
        date: ds,
        times: m.times?.length ? m.times : ['08:00'],
      });
    }

    cursor = addDays(cursor, 1);
  }

  return out;
}

export function scheduleLabel(m: Med): string {
  switch (m.freq) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return `Monthly on day ${m.monthDay}`;
    case 'interval': {
      const n = Math.max(1, Math.floor(m.intervalDays ?? 2));
      if (n === 1) return 'Daily';
      if (n === 2) return 'Every other day';
      return `Every ${n} days`;
    }
    default:
      return 'Daily';
  }
}
