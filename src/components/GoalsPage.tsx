import { useState } from 'react';
import { Goal, Task } from '../types';
import { Target, Plus, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface GoalsPageProps {
  goals: Goal[];
  setGoals: (value: Goal[] | ((prev: Goal[]) => Goal[])) => void;
}

const categories = [
  { value: 'health', label: '🏃 Health', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'learning', label: '📚 Learning', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'creative', label: '🎨 Creative', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'personal', label: '💛 Personal', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'career', label: '💼 Career', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export default function GoalsPage({ goals, setGoals }: GoalsPageProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<Goal['category']>('personal');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const addGoal = () => {
    if (!newTitle.trim()) return;
    const goal: Goal = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      category: newCategory,
      completed: false,
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    setGoals((prev: Goal[]) => [goal, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setShowAddGoal(false);
  };

  const toggleGoal = (id: string) => {
    setGoals((prev: Goal[]) => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev: Goal[]) => prev.filter(g => g.id !== id));
  };

  const addTask = (goalId: string) => {
    if (!newTaskTitle.trim()) return;
    const task: Task = { id: Date.now().toString(), title: newTaskTitle, completed: false };
    setGoals((prev: Goal[]) => prev.map(g =>
      g.id === goalId ? { ...g, tasks: [...g.tasks, task] } : g
    ));
    setNewTaskTitle('');
  };

  const toggleTask = (goalId: string, taskId: string) => {
    setGoals((prev: Goal[]) => prev.map(g =>
      g.id === goalId ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : g
    ));
  };

  const deleteTask = (goalId: string, taskId: string) => {
    setGoals((prev: Goal[]) => prev.map(g =>
      g.id === goalId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g
    ));
  };

  const filteredGoals = goals.filter(g => {
    if (filter === 'active') return !g.completed;
    if (filter === 'completed') return g.completed;
    return true;
  });

  const getProgress = (goal: Goal) => {
    if (goal.tasks.length === 0) return 0;
    return Math.round((goal.tasks.filter(t => t.completed).length / goal.tasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="text-amber-500" size={24} />
          Goals & Habits
        </h1>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition flex items-center gap-1"
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
              filter === f ? 'bg-amber-100 text-amber-700 font-medium' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {f} ({f === 'all' ? goals.length : f === 'active' ? goals.filter(g => !g.completed).length : goals.filter(g => g.completed).length})
          </button>
        ))}
      </div>

      {/* Add Goal Form */}
      {showAddGoal && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 space-y-4">
          <h3 className="font-semibold text-gray-800">Create New Goal</h3>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Goal title..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-300"
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-300 resize-none"
            rows={2}
          />
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setNewCategory(cat.value as Goal['category'])}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                    newCategory === cat.value ? cat.color + ' font-medium' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addGoal}
              className="flex-1 bg-amber-500 text-white py-2 rounded-xl font-medium hover:bg-amber-600 transition"
            >
              Create Goal 🎯
            </button>
            <button
              onClick={() => setShowAddGoal(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl mb-4 block">🎯</span>
          <p className="text-gray-400">
            {filter === 'all' ? "No goals yet. Create your first goal!" : `No ${filter} goals.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map(goal => {
            const progress = getProgress(goal);
            const isExpanded = expandedGoal === goal.id;
            const cat = categories.find(c => c.value === goal.category);

            return (
              <div key={goal.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${goal.completed ? 'border-green-200 opacity-75' : 'border-gray-100'}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        goal.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-amber-400'
                      }`}
                    >
                      {goal.completed && <Check size={12} className="text-white" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${goal.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {goal.title}
                        </h3>
                        {cat && <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.color}`}>{cat.label}</span>}
                      </div>
                      {goal.description && <p className="text-sm text-gray-500 mb-2">{goal.description}</p>}
                      
                      {/* Progress bar */}
                      {goal.tasks.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{progress}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="mt-3 space-y-2">
                      {goal.tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTask(goal.id, task.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                              task.completed ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                            }`}
                          >
                            {task.completed && <Check size={10} className="text-white" />}
                          </button>
                          <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {task.title}
                          </span>
                          <button
                            onClick={() => deleteTask(goal.id, task.id)}
                            className="text-gray-300 hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a task..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-300"
                        onKeyDown={(e) => e.key === 'Enter' && addTask(goal.id)}
                      />
                      <button
                        onClick={() => addTask(goal.id)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm hover:bg-amber-100 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
