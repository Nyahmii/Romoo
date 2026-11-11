import { useMemo, useState } from 'react';
import GoalTree, { GoalNode } from './GoalTree';

function collectKnown(nodes: GoalNode[], path: string[]): { title: string; path: string[] }[] {
  let out: { title: string; path: string[] } = [];
  (nodes || []).forEach(n => {
    if (!n.children.length && n.status === 'known') out.push({ title: n.title, path });
    out = out.concat(collectKnown(n.children, [...path, n.title]));
  });
  return out;
}

export default function TrickLibraryPage() {
  const [tick, setTick] = useState(0);
  const learned = useMemo(() => {
    try { return collectKnown(JSON.parse(localStorage.getItem('romo-trick-tree') || '[]'), []); } catch { return []; }
  }, [tick]);
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-teal-100 to-cyan-100 rounded-2xl p-5 border border-teal-200">
        <h2 className="text-lg font-semibold text-teal-800">🛹 Trick Library — Flow Tree</h2>
        <p className="text-xs text-teal-700 mt-1">Made for Hazel: branch tricks 10 levels deep. Scratch one off and it lands in your Learned shelf below!</p>
      </div>
      <GoalTree storageKey="romo-trick-tree" title="Trick Goals" onChange={() => setTick(t => t + 1)} />
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm mb-2">🎓 Learned & Landed ({learned.length})</h3>
        {learned.length === 0 && <p className="text-gray-400 text-xs py-2">Nothing learned yet — scratch tricks off the tree above and they'll collect here with their categories!</p>}
        {learned.map((l, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-emerald-500 text-sm">✓</span>
            <div>
              <p className="text-sm text-gray-700 line-through decoration-emerald-400">{l.title}</p>
              {l.path.length > 0 && <p className="text-[10px] text-gray-400">📂 {l.path.join(' › ')}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
