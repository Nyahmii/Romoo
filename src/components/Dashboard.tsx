import { useState } from 'react';
import type { DailyCheckIn, SleepLog, Movement } from '../types';
import { getDailyAffirmation } from '../data/affirmations';
import { format } from 'date-fns';
import { Moon, Heart, Zap, Pill, Check, Plus, Trash2 } from 'lucide-react';

type Freq = 'daily' | 'weekly' | 'biweekly' | 'monthly';
interface Med { id: string; name: string; emoji: string; dose: string; pillsLeft: number | null; refillAt: number; start: string; end: string; freq: Freq; times: string[]; weekdays: number[]; monthDay: number; remind: boolean; note: string; }
interface Intake { medId: string; date: string; time: string; status: 'taken' | 'skipped'; note: string; }

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s: string) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const TODAY = () => fmt(new Date());

interface DashboardProps {
  checkIns: DailyCheckIn[];
  setCheckIns: (value: DailyCheckIn[] | ((prev: DailyCheckIn[]) => DailyCheckIn[])) => void;
  sleepLogs: SleepLog[];
  setSleepLogs: (value: SleepLog[] | ((prev: SleepLog[]) => SleepLog[])) => void;
  movements: Movement[];
  setMovements: (value: Movement[] | ((prev: Movement[]) => Movement[])) => void;
  profileName: string;
  meds: Med[];
  setMeds: (m: Med[]) => void;
  intakes: Intake[];
  setIntakes: (i: Intake[]) => void;
}

const moodEmojis = {
  great: { emoji: '😄', label: 'Great', color: 'bg-green-100 text-green-700 border-green-200' },
  good: { emoji: '😊', label: 'Good', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  okay: { emoji: '😐', label: 'Okay', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { emoji: '😔', label: 'Low', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  bad: { emoji: '😢', label: 'Bad', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function Dashboard({ checkIns, setCheckIns, sleepLogs, setSleepLogs, movements, setMovements, profileName, meds, setMeds, intakes, setIntakes }: DashboardProps) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [mood, setMood] = useState<DailyCheckIn['mood']>('okay');
  const [energy, setEnergy] = useState(3);
  const [gratitude, setGratitude] = useState(['', '', '']);
  const [notes, setNotes] = useState('');
  const [sleepQuality, setSleepQuality] = useState(3);
  const [sleepNotes, setSleepNotes] = useState('');
  const [movementType, setMovementType] = useState<Movement['type']>('walk');
  const [movementDuration, setMovementDuration] = useState(15);
  const [movementIntensity, setMovementIntensity] = useState<Movement['intensity']>('moderate');
  const [movementNotes, setMovementNotes] = useState('');

  // Polyphasic Sleep State
  const [sleepSegments, setSleepSegments] = useState<{id: string, start: string, end: string}[]>([
    { id: '1', start: '23:00', end: '07:00' }
  ]);

  const addSleepSegment = () => {
    setSleepSegments([...sleepSegments, { id: Date.now().toString(), start: '02:00', end: '04:00' }]);
  };

  const removeSleepSegment = (id: string) => {
    if (sleepSegments.length > 1) setSleepSegments(sleepSegments.filter(s => s.id !== id));
  };

  const calculateTotalSleep = () => {
    return sleepSegments.reduce((total, seg) => {
      const [sh, sm] = seg.start.split(':').map(Number);
      const [eh, em] = seg.end.split(':').map(Number);
      let startMins = sh * 60 + sm;
      let endMins = eh * 60 + em;
      if (endMins <= startMins) endMins += 1440; // Handles crossing midnight
      return total + (endMins - startMins);
    }, 0) / 60;
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCheckIn = checkIns.find(c => c.date === today);
  const todaySleep = sleepLogs.find(s => s.date === today);
  const todayMovements = movements.filter(m => m.date === today);

  const handleSubmitCheckIn = () => {
    const newCheckIn: DailyCheckIn = {
      id: Date.now().toString(),
      date: today,
      mood,
      energy,
      gratitude: gratitude.filter(g => g.trim() !== ''),
      notes,
      createdAt: new Date().toISOString(),
    };
    if (todayCheckIn) {
      setCheckIns((prev: DailyCheckIn[]) => prev.map(c => c.id === todayCheckIn.id ? newCheckIn : c));
    } else {
      setCheckIns((prev: DailyCheckIn[]) => [newCheckIn, ...prev]);
    }
    setShowCheckIn(false);
    setGratitude(['', '', '']);
    setNotes('');
  };

  const handleSubmitSleep = () => {
    const newLog: any = {
      id: Date.now().toString(),
      date: today,
      segments: sleepSegments, 
      totalHours: Math.round(calculateTotalSleep() * 10) / 10,
      quality: sleepQuality,
      notes: sleepNotes,
    };
    if (todaySleep) {
      setSleepLogs((prev: any[]) => prev.map(s => s.id === todaySleep.id ? newLog : s));
    } else {
      setSleepLogs((prev: any[]) => [newLog, ...prev]);
    }
    setShowSleep(false);
    setSleepNotes('');
  };

  const handleSubmitMovement = () => {
    const newMovement: Movement = {
      id: Date.now().toString(),
      date: today,
      type: movementType,
      duration: movementDuration,
      intensity: movementIntensity,
      notes: movementNotes,
    };
    setMovements((prev: Movement[]) => [newMovement, ...prev]);
    setShowMovement(false);
    setMovementNotes('');
  };

  const streak = (() => {
    let count = 0;
    const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 0; i < sorted.length; i++) {
      const expected = format(new Date(Date.now() - i * 86400000), 'yyyy-MM-dd');
      if (sorted[i]?.date === expected) count++;
      else break;
    }
    return count;
  })();

  // Meds Logic
  const todayMeds = meds.filter(m => {
    if (today < m.start || (m.end && today > m.end)) return false;
    const d = parse(today);
    if (m.freq === 'daily') return true;
    if (m.freq === 'monthly') return d.getDate() === Math.min(m.monthDay, dim(d.getFullYear(), d.getMonth()));
    if (!m.weekdays.includes(d.getDay())) return false;
    if (m.freq === 'weekly') return true;
    return Math.floor((d.getTime() - parse(m.start).getTime()) / 604800000) % 2 === 0;
  });

  const toggleMedStatus = (m: Med, time: string, status: 'taken' | 'skipped' | null) => {
    const old = intakes.find(i => i.medId === m.id && i.date === today && i.time === time);
    const oldTaken = old?.status === 'taken' ? 1 : 0;
    const newTaken = status === 'taken' ? 1 : 0;
    let next = intakes.filter(i => !(i.medId === m.id && i.date === today && i.time === time));
    if (status) next = [{ medId: m.id, date: today, time, status, note: old?.note || '' }, ...next];
    setIntakes(next);
    localStorage.setItem('romo-intakes-v2', JSON.stringify(next));
    
    if (m.pillsLeft !== null && oldTaken !== newTaken) {
      const newMeds = meds.map(x => x.id === m.id ? { ...x, pillsLeft: Math.max(0, (x.pillsLeft || 0) + oldTaken - newTaken) } : x);
      setMeds(newMeds);
      localStorage.setItem('romo-meds-v2', JSON.stringify(newMeds));
    }
  };

  return (
    <div className="space-y-6">
      {/* Affirmation Card */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-5 border border-amber-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🦦</span>
          <div>
            <p className="text-amber-800 font-medium text-sm">Romo says:</p>
            <p className="text-amber-900 mt-1">{getDailyAffirmation()}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-xl font-bold text-gray-800">{streak}</div>
          <div className="text-xs text-gray-500">Day Streak</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-2xl mb-1">💤</div>
          <div className="text-xl font-bold text-gray-800">{sleepLogs.length}</div>
          <div className="text-xs text-gray-500">Sleep Logs</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-2xl mb-1">🏃</div>
          <div className="text-xl font-bold text-gray-800">{movements.reduce((a, m) => a + m.duration, 0)}</div>
          <div className="text-xs text-gray-500">Minutes Active</div>
        </div>
      </div>

      {/* Today's Medications */}
      {todayMeds.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Pill size={18} className="text-rose-500" />
              Today's Medications
            </h2>
          </div>
          <div className="space-y-3">
            {todayMeds.map(m => (
              <div key={m.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <p className="text-sm font-medium text-gray-800">{m.emoji} {m.name} <span className="text-xs text-gray-400">• {m.dose}</span></p>
                {m.times.map(t => {
                  const it = intakes.find(i => i.medId === m.id && i.date === today && i.time === t);
                  const isTaken = it?.status === 'taken';
                  const isSkipped = it?.status === 'skipped';
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">{t}</span>
                      <button 
                        onClick={() => toggleMedStatus(m, t, isTaken ? null : 'taken')}
                        className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 border ${isTaken ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                      >
                        <Check size={12} /> {isTaken ? 'Taken' : 'Mark Taken'}
                      </button>
                      <button 
                         onClick={() => toggleMedStatus(m, t, isSkipped ? null : 'skipped')}
                         className={`px-2 py-1 rounded-lg text-xs border ${isSkipped ? 'bg-pink-100 border-pink-200 text-pink-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                      >
                        Skipped
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Check-In Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Heart size={18} className="text-pink-500" />
            Daily Check-In
          </h2>
          {!todayCheckIn && (
            <button
              onClick={() => setShowCheckIn(!showCheckIn)}
              className="text-sm bg-pink-50 text-pink-600 px-3 py-1 rounded-lg hover:bg-pink-100 transition"
            >
              {showCheckIn ? 'Cancel' : '+ Check In'}
            </button>
          )}
        </div>

        {todayCheckIn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{moodEmojis[todayCheckIn.mood].emoji}</span>
              <div>
                <p className="font-medium text-gray-800">Feeling {moodEmojis[todayCheckIn.mood].label}</p>
                <p className="text-sm text-gray-500">Energy: {'⚡'.repeat(todayCheckIn.energy)}</p>
              </div>
            </div>
            {todayCheckIn.gratitude.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-700 mb-1">Grateful for:</p>
                {todayCheckIn.gratitude.map((g, i) => (
                  <p key={i} className="text-sm text-yellow-800">• {g}</p>
                ))}
              </div>
            )}
            {todayCheckIn.notes && (
              <p className="text-sm text-gray-600 italic">"{todayCheckIn.notes}"</p>
            )}
          </div>
        ) : showCheckIn ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">How are you feeling?</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(moodEmojis) as [DailyCheckIn['mood'], typeof moodEmojis.great][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setMood(key)}
                    className={`px-3 py-2 rounded-lg border text-sm transition ${
                      mood === key ? val.color + ' border-current font-medium' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {val.emoji} {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Energy Level</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setEnergy(n)}
                    className={`w-10 h-10 rounded-lg border text-sm font-medium transition ${
                      energy >= n ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">What are you grateful for?</label>
              {gratitude.map((g, i) => (
                <input
                  key={i}
                  type="text"
                  value={g}
                  onChange={(e) => {
                    const newG = [...gratitude];
                    newG[i] = e.target.value;
                    setGratitude(newG);
                  }}
                  placeholder={`Gratitude #${i + 1}...`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 mb-2 text-sm focus:outline-none focus:border-amber-300"
                />
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any thoughts or reflections..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-300 resize-none"
              rows={2}
            />
            <button
              onClick={handleSubmitCheckIn}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition shadow-sm"
            >
              Save Check-In ✨
            </button>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Tap "+ Check In" to log how you're feeling today!</p>
        )}
      </div>

      {/* Sleep Tracker */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Moon size={18} className="text-indigo-500" />
            Sleep Tracker
          </h2>
          <button
            onClick={() => setShowSleep(!showSleep)}
            className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-100 transition"
          >
            {showSleep ? 'Cancel' : todaySleep ? 'Update' : '+ Log Sleep'}
          </button>
        </div>

        {todaySleep && !showSleep ? (
          <div className="space-y-2">
            {todaySleep.segments ? (
              <div className="space-y-1">
                {todaySleep.segments.map((seg: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-500">
                    <span>Block {idx + 1}</span>
                    <span>{seg.start} - {seg.end}</span>
                  </div>
                ))}
                <p className="font-medium text-gray-800 mt-2">Total: {todaySleep.totalHours || '0'}h</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bedtime</span>
                  <span className="font-medium text-gray-800">{todaySleep.bedtime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Wake time</span>
                  <span className="font-medium text-gray-800">{todaySleep.wakeTime}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Quality</span>
              <span>{'⭐'.repeat(todaySleep.quality)}</span>
            </div>
            {todaySleep.notes && <p className="text-sm text-gray-500 italic">"{todaySleep.notes}"</p>}
          </div>
        ) : showSleep ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-600">Sleep Blocks (Total: {calculateTotalSleep().toFixed(1)}h)</p>
            {sleepSegments.map((seg, idx) => (
              <div key={seg.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                <span className="text-xs text-gray-500 w-16">Block {idx + 1}</span>
                <input type="time" value={seg.start} onChange={e => setSleepSegments(sleepSegments.map(s => s.id === seg.id ? {...s, start: e.target.value} : s))} className="flex-1 px-2 py-1 rounded border border-gray-200 text-sm" />
                <span className="text-gray-400">to</span>
                <input type="time" value={seg.end} onChange={e => setSleepSegments(sleepSegments.map(s => s.id === seg.id ? {...s, end: e.target.value} : s))} className="flex-1 px-2 py-1 rounded border border-gray-200 text-sm" />
                {sleepSegments.length > 1 && (
                  <button onClick={() => removeSleepSegment(seg.id)} className="text-red-400"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
            <button onClick={addSleepSegment} className="text-indigo-500 text-xs flex items-center gap-1"><Plus size={12} /> Add interrupted sleep block</button>
            
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Overall Sleep Quality</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setSleepQuality(n)}
                    className={`w-10 h-10 rounded-lg border text-sm transition ${
                      sleepQuality >= n ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={sleepNotes}
              onChange={(e) => setSleepNotes(e.target.value)}
              placeholder="Dreams, interruptions, restfulness..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300 resize-none"
              rows={2}
            />
            <button
              onClick={handleSubmitSleep}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition shadow-sm"
            >
              Save Sleep Log 🌙
            </button>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Track your sleep to build better rest habits!</p>
        )}
      </div>

      {/* Movement Tracker */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Zap size={18} className="text-teal-500" />
            Movement
          </h2>
          <button
            onClick={() => setShowMovement(!showMovement)}
            className="text-sm bg-teal-50 text-teal-600 px-3 py-1 rounded-lg hover:bg-teal-100 transition"
          >
            {showMovement ? 'Cancel' : '+ Log Activity'}
          </button>
        </div>

        {todayMovements.length > 0 && !showMovement ? (
          <div className="space-y-2">
            {todayMovements.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-teal-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-800 capitalize">{m.type} • {m.duration}min</p>
                  <p className="text-xs text-gray-500 capitalize">{m.intensity}</p>
                </div>
                <span className="text-teal-600 font-medium">{m.duration}min</span>
              </div>
            ))}
          </div>
        ) : showMovement ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Activity Type</label>
              <div className="flex gap-2 flex-wrap">
                {(['stretch', 'walk', 'yoga', 'dance', 'other'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setMovementType(type)}
                    className={`px-3 py-1.5 rounded-lg border text-sm capitalize transition ${
                      movementType === type ? 'bg-teal-100 border-teal-300 text-teal-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {type === 'stretch' ? '🧘' : type === 'walk' ? '🚶' : type === 'yoga' ? '🧘‍♀️' : type === 'dance' ? '💃' : '🏃'} {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Duration (minutes)</label>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={movementDuration}
                onChange={(e) => setMovementDuration(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-center text-sm text-teal-600 font-medium">{movementDuration} minutes</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Intensity</label>
              <div className="flex gap-2">
                {(['gentle', 'moderate', 'intense'] as const).map(int => (
                  <button
                    key={int}
                    onClick={() => setMovementIntensity(int)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm capitalize transition ${
                      movementIntensity === int ? 'bg-teal-100 border-teal-300 text-teal-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {int}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={movementNotes}
              onChange={(e) => setMovementNotes(e.target.value)}
              placeholder="How did it feel?"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-teal-300 resize-none"
              rows={2}
            />
            <button
              onClick={handleSubmitMovement}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2.5 rounded-xl font-medium hover:from-teal-600 hover:to-emerald-600 transition shadow-sm"
            >
              Log Activity 💪
            </button>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Move your body in any way that feels good today!</p>
        )}
      </div>

      {/* Romo Tip */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-4 border border-teal-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🦦</span>
          <div>
            <p className="text-teal-800 font-medium text-sm">Romo's Tip</p>
            <p className="text-teal-700 text-sm mt-0.5">
              {todayCheckIn ? "Great job checking in today! Remember to take breaks and stay hydrated 💧" : "Start your day with a check-in — it only takes a minute and helps you stay mindful! 🌟"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
