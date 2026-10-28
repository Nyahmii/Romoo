import { useState } from 'react';
import { DailyCheckIn, SleepLog, Movement, Goal, Hobby } from '../types';
import { format, parseISO } from 'date-fns';
import { Clock, Heart, Moon, Zap, Target } from 'lucide-react';

interface HistoryPageProps {
  checkIns: DailyCheckIn[];
  sleepLogs: SleepLog[];
  movements: Movement[];
  goals: Goal[];
  hobbies: Hobby[];
}

type HistoryTab = 'checkins' | 'sleep' | 'movement' | 'goals';

const moodEmojis: Record<string, string> = {
  great: '😄', good: '😊', okay: '😐', low: '😔', bad: '😢'
};

export default function HistoryPage({ checkIns, sleepLogs, movements, goals }: HistoryPageProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('checkins');

  const tabs: { key: HistoryTab; label: string; icon: typeof Heart; count: number }[] = [
    { key: 'checkins', label: 'Check-Ins', icon: Heart, count: checkIns.length },
    { key: 'sleep', label: 'Sleep', icon: Moon, count: sleepLogs.length },
    { key: 'movement', label: 'Movement', icon: Zap, count: movements.length },
    { key: 'goals', label: 'Goals', icon: Target, count: goals.length },
  ];

  const renderCheckIns = () => {
    if (checkIns.length === 0) return <EmptyState emoji="📝" message="No check-ins yet. Start logging your daily mood!" />;
    return (
      <div className="space-y-3">
        {checkIns.map(ci => (
          <div key={ci.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{format(parseISO(ci.date), 'EEEE, MMM d, yyyy')}</span>
              <span className="text-2xl">{moodEmojis[ci.mood]}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                Energy: {'⚡'.repeat(ci.energy)}
              </span>
              <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full capitalize">
                {ci.mood}
              </span>
            </div>
            {ci.gratitude.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-2 mb-2">
                <p className="text-xs text-yellow-700">
                  {ci.gratitude.map((g, i) => `${i > 0 ? ' • ' : ''}${g}`).join('')}
                </p>
              </div>
            )}
            {ci.notes && <p className="text-sm text-gray-500 italic">"{ci.notes}"</p>}
          </div>
        ))}
      </div>
    );
  };

  const renderSleep = () => {
    if (sleepLogs.length === 0) return <EmptyState emoji="🌙" message="No sleep logs yet. Track your sleep for better rest!" />;
    return (
      <div className="space-y-3">
        {sleepLogs.map(sl => {
          const [bh, bm] = sl.bedtime.split(':').map(Number);
          const [wh, wm] = sl.wakeTime.split(':').map(Number);
          let hours = (wh * 60 + wm - bh * 60 - bm) / 60;
          if (hours < 0) hours += 24;

          return (
            <div key={sl.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{format(parseISO(sl.date), 'EEEE, MMM d')}</span>
                <span className="text-lg">{'⭐'.repeat(sl.quality)}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-400">Bedtime</p>
                  <p className="font-medium text-gray-700">{sl.bedtime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Wake</p>
                  <p className="font-medium text-gray-700">{sl.wakeTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="font-medium text-indigo-600">{hours.toFixed(1)}h</p>
                </div>
              </div>
              {sl.notes && <p className="text-sm text-gray-500 italic mt-2">"{sl.notes}"</p>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMovement = () => {
    if (movements.length === 0) return <EmptyState emoji="🏃" message="No movement logged yet. Any activity counts!" />;
    return (
      <div className="space-y-3">
        {movements.map(m => (
          <div key={m.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{format(parseISO(m.date), 'MMM d, yyyy')}</span>
              <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full capitalize">
                {m.intensity}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 capitalize flex items-center gap-2">
                  {m.type === 'stretch' ? '🧘' : m.type === 'walk' ? '🚶' : m.type === 'yoga' ? '🧘‍♀️' : m.type === 'dance' ? '💃' : '🏃'}
                  {m.type}
                </p>
                {m.notes && <p className="text-sm text-gray-500 mt-1">{m.notes}</p>}
              </div>
              <span className="text-lg font-bold text-teal-600">{m.duration}<span className="text-xs font-normal text-gray-400">min</span></span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGoals = () => {
    if (goals.length === 0) return <EmptyState emoji="🎯" message="No goals set yet. Create your first goal!" />;
    return (
      <div className="space-y-3">
        {goals.map(g => {
          const completedTasks = g.tasks.filter(t => t.completed).length;
          return (
            <div key={g.id} className={`bg-white rounded-xl p-4 border shadow-sm ${g.completed ? 'border-green-200' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-medium ${g.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {g.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${g.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {g.completed ? 'Done ✓' : 'In Progress'}
                </span>
              </div>
              {g.description && <p className="text-sm text-gray-500 mb-2">{g.description}</p>}
              {g.tasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                      style={{ width: `${g.tasks.length > 0 ? (completedTasks / g.tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{completedTasks}/{g.tasks.length}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="text-teal-500" size={24} />
          History
        </h1>
        <p className="text-gray-500 text-sm mt-1">Review your past logs and progress 📊</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'checkins' && renderCheckIns()}
      {activeTab === 'sleep' && renderSleep()}
      {activeTab === 'movement' && renderMovement()}
      {activeTab === 'goals' && renderGoals()}
    </div>
  );
}

function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <div className="text-center py-12">
      <span className="text-5xl mb-4 block">{emoji}</span>
      <p className="text-gray-400">{message}</p>
    </div>
  );
}
