import { useMemo } from 'react';
import { DailyCheckIn, SleepLog, Movement, Goal } from '../types';
import { format, parseISO, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, BarChart3, Target } from 'lucide-react';

interface StatisticsPageProps {
  checkIns: DailyCheckIn[];
  sleepLogs: SleepLog[];
  movements: Movement[];
  goals: Goal[];
}

const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316'];

export default function StatisticsPage({ checkIns, sleepLogs, movements, goals }: StatisticsPageProps) {
  // Last 7 days data
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }
    return days;
  }, []);

  // Mood trend data
  const moodData = useMemo(() => {
    const moodMap: Record<string, number> = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };
    return last7Days.map(day => {
      const checkIn = checkIns.find(c => c.date === day);
      return {
        date: format(parseISO(day), 'EEE'),
        mood: checkIn ? moodMap[checkIn.mood] : null,
        energy: checkIn?.energy || null,
      };
    });
  }, [checkIns, last7Days]);

  // Sleep data
  const sleepData = useMemo(() => {
    return last7Days.map(day => {
      const log = sleepLogs.find(s => s.date === day);
      let hours = 0;
      if (log) {
        const [bh, bm] = log.bedtime.split(':').map(Number);
        const [wh, wm] = log.wakeTime.split(':').map(Number);
        hours = (wh * 60 + wm - bh * 60 - bm) / 60;
        if (hours < 0) hours += 24;
      }
      return {
        date: format(parseISO(day), 'EEE'),
        hours: hours || null,
        quality: log?.quality || null,
      };
    });
  }, [sleepLogs, last7Days]);

  // Movement data
  const movementData = useMemo(() => {
    return last7Days.map(day => {
      const dayMovements = movements.filter(m => m.date === day);
      const totalMinutes = dayMovements.reduce((sum, m) => sum + m.duration, 0);
      return {
        date: format(parseISO(day), 'EEE'),
        minutes: totalMinutes || null,
      };
    });
  }, [movements, last7Days]);

  // Goal completion data
  const goalData = useMemo(() => {
    const categories = ['health', 'learning', 'creative', 'personal', 'career'];
    return categories.map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: goals.filter(g => g.category === cat).length,
      completed: goals.filter(g => g.category === cat && g.completed).length,
    })).filter(d => d.value > 0);
  }, [goals]);

  // Weekly summary radar
  const weeklySummary = useMemo(() => {
    const checkInRate = (checkIns.filter(c => last7Days.includes(c.date)).length / 7) * 100;
    const sleepRate = (sleepLogs.filter(s => last7Days.includes(s.date)).length / 7) * 100;
    const movementDays = new Set(movements.filter(m => last7Days.includes(m.date)).map(m => m.date)).size;
    const movementRate = (movementDays / 7) * 100;
    const goalRate = goals.length > 0 ? (goals.filter(g => g.completed).length / goals.length) * 100 : 0;
    
    return [
      { subject: 'Check-Ins', A: checkInRate },
      { subject: 'Sleep', A: sleepRate },
      { subject: 'Movement', A: movementRate },
      { subject: 'Goals', A: goalRate },
    ];
  }, [checkIns, sleepLogs, movements, goals, last7Days]);

  // Averages
  const avgEnergy = useMemo(() => {
    const energies = checkIns.map(c => c.energy);
    return energies.length > 0 ? (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1) : '0';
  }, [checkIns]);

  const avgSleep = useMemo(() => {
    const hours = sleepLogs.map(log => {
      const [bh, bm] = log.bedtime.split(':').map(Number);
      const [wh, wm] = log.wakeTime.split(':').map(Number);
      let h = (wh * 60 + wm - bh * 60 - bm) / 60;
      if (h < 0) h += 24;
      return h;
    });
    return hours.length > 0 ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : '0';
  }, [sleepLogs]);

  const totalMovement = useMemo(() => {
    return movements.reduce((sum, m) => sum + m.duration, 0);
  }, [movements]);

  const streak = useMemo(() => {
    let count = 0;
    const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 0; i < sorted.length; i++) {
      const expected = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (sorted[i]?.date === expected) count++;
      else break;
    }
    return count;
  }, [checkIns]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="text-emerald-500" size={24} />
          Statistics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Visual insights into your wellness journey 📊</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <p className="text-xs text-amber-600 font-medium">Avg Energy</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">{avgEnergy}<span className="text-sm font-normal">/5</span></p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <p className="text-xs text-indigo-600 font-medium">Avg Sleep</p>
          <p className="text-2xl font-bold text-indigo-800 mt-1">{avgSleep}<span className="text-sm font-normal">hrs</span></p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100">
          <p className="text-xs text-teal-600 font-medium">Total Active</p>
          <p className="text-2xl font-bold text-teal-800 mt-1">{totalMovement}<span className="text-sm font-normal">min</span></p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
          <p className="text-xs text-pink-600 font-medium">Streak</p>
          <p className="text-2xl font-bold text-pink-800 mt-1">{streak}<span className="text-sm font-normal">days</span></p>
        </div>
      </div>

      {/* Mood & Energy Trend */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-lg">😊</span> Mood & Energy (7 Days)
        </h2>
        {checkIns.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2} name="Mood" dot={{ fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} name="Energy" dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Start checking in daily to see your mood trends!" />
        )}
      </div>

      {/* Sleep Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-lg">🌙</span> Sleep Duration (7 Days)
        </h2>
        {sleepLogs.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sleepData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Log your sleep to track your rest patterns!" />
        )}
      </div>

      {/* Movement Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-lg">🏃</span> Movement (7 Days)
        </h2>
        {movements.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Minutes" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Log your movement to see your activity trends!" />
        )}
      </div>

      {/* Goals Distribution */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target size={18} className="text-amber-500" /> Goals by Category
        </h2>
        {goals.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={goalData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {goalData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 w-full">
              {goalData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-gray-500">{item.completed}/{item.value} done</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyChart message="Set some goals to see your progress distribution!" />
        )}
      </div>

      {/* Weekly Wellness Radar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-emerald-500" /> Weekly Wellness Score
        </h2>
        {(checkIns.length > 0 || sleepLogs.length > 0 || movements.length > 0 || goals.length > 0) ? (
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={weeklySummary}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="This Week" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
              <Tooltip formatter={(value: number) => `${Math.round(value)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Start tracking to see your wellness radar!" />
        )}
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
        <h2 className="font-semibold text-amber-800 mb-3">🦦 Romo's Insights</h2>
        <div className="space-y-2 text-sm text-amber-700">
          {checkIns.length >= 3 && (
            <p>• You've checked in {checkIns.length} times! {streak > 2 ? `Amazing ${streak}-day streak! 🔥` : 'Keep it up!'}</p>
          )}
          {sleepLogs.length >= 3 && (
            <p>• Average sleep: {avgSleep} hours. {Number(avgSleep) >= 7 ? 'Great rest! 💤' : 'Try to get 7-9 hours for optimal health.'}</p>
          )}
          {movements.length >= 3 && (
            <p>• Total active time: {totalMovement} minutes. {totalMovement >= 150 ? 'You\'re crushing it! 💪' : 'Aim for 150 min/week.'}</p>
          )}
          {goals.length > 0 && (
            <p>• {goals.filter(g => g.completed).length}/{goals.length} goals completed. {goals.filter(g => g.completed).length === goals.length ? 'All done! 🎉' : 'Keep going!'}</p>
          )}
          {checkIns.length === 0 && sleepLogs.length === 0 && movements.length === 0 && (
            <p>Start tracking your daily habits to see personalized insights here! 🌟</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <span className="text-3xl mb-2 block">📈</span>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
