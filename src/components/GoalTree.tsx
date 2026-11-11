import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type SkillStatus = 'unknown' | 'learning' | 'known';
export interface GoalNode { id: string; title: string; status: SkillStatus; children: GoalNode[]; }
export const MAX_DEPTH = 10;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const WEIGHT: Record<SkillStatus, number> = { unknown: 0, learning: 0.5, known: 1 };

function migrate(nodes: any[]): GoalNode[] {
  return (nodes || []).map(n => ({ id: n.id, title: n.title, status: n.status || (n.completed ? 'known' : 'unknown'), children: migrate(n.children || []) }));
}
const load = (k: string): GoalNode[] => { try { const v = localStorage.getItem(k); return v ? migrate(JSON.parse(v)) : []; } catch { return []; } };

function stats(n: GoalNode): { score: number; total: number } {
  if (!n.children.length) return { score: WEIGHT[n.status], total: 1 };
  return n.children.reduce((a, c) => { const s = stats(c); return { score: a.score + s.score, total: a.total + s.total }; }, { score: 0, total: 0 });
}
const pctOf = (n: GoalNode) => { const s = stats(n); return s.total ? Math.round((100 * s.score) / s.total) : 0; };
const mapTree = (nodes: GoalNode[], fn: (n: GoalNode) => GoalNode): GoalNode[] => nodes.map(n => fn({ ...n, children: mapTree(n.children, fn) }));
const nextStatus = (s: SkillStatus): SkillStatus => (s === 'unknown' ? 'learning' : s === 'learning' ? 'known' : 'unknown');
const addChild = (nodes: GoalNode[], pid: string, child: GoalNode): GoalNode[] => nodes.map(n => n.id === pid ? { ...n, children: [...n.children, child] } : { ...n, children: addChild(n.children, pid, child) });
const removeNode = (nodes: GoalNode[], id: string): GoalNode[] => nodes.filter(n => n.id !== id).map(n => ({ ...n, children: removeNode(n.children, id) }));

export default function GoalTree({ storageKey, title, onChange }: { storageKey: string; title: string; onChange?: () => void }) {
  const [roots, setRoots] = useState<GoalNode[]>(() => load(storageKey));
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const persist = (next: GoalNode[]) => { setRoots(next); save(storageKey, next); if (onChange) onChange(); };
  const submitAdd = (pid: string | null) => {
    if (!draft.trim()) return;
    const child: GoalNode = { id: uid(), title: draft.trim(), status: 'unknown', children: [] };
    persist(pid ? addChild(roots, pid, child) : [...roots, child]);
    setDraft(''); setAdding(null);
  };
  const overall = roots.length ? Math.round(roots.reduce((a, r) => a + pctOf(r), 0) / roots.length) : 0;
  
  const renderNode = (node: GoalNode, depth: number) => {
    const p = pctOf(node);
    const canChild = depth + 1 < MAX_DEPTH;
    const hasChildren = node.children.length > 0;
    
    // If it has children, status is aggregate. If leaf, status is its own.
    const aggregateStatus: SkillStatus = hasChildren 
      ? (p === 100 ? 'known' : p > 0 ? 'learning' : 'unknown') 
      : node.status;
      
    const dot = aggregateStatus === 'known'
      ? 'bg-emerald-400 border-emerald-400 text-white'
      : aggregateStatus === 'learning' ? 'bg-amber-300 border-amber-300 text-amber-800' : 'border-gray-300 text-transparent';
    const badge = p >= 80 ? 'bg-emerald-100 text-emerald-700' : p >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500';
    
    return (
      <div key={node.id} style={{ marginLeft: depth ? 12 : 0 }} className="mt-1">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 border bg-white border-gray-100">
          {hasChildren ? (
            <span className={'w-5 h-5 shrink-0 rounded-full border text-[10px] flex items-center justify-center ' + dot} title="Status based on sub-items">
              {aggregateStatus === 'known' ? '✓' : aggregateStatus === 'learning' ? '◐' : ''}
            </span>
          ) : (
            <button title="Tap: to-learn → learning → known" onClick={() => persist(mapTree(roots, n => n.id === node.id ? { ...n, status: nextStatus(n.status) } : n))} className={'w-5 h-5 shrink-0 rounded-full border text-[10px] flex items-center justify-center ' + dot}>
              {node.status === 'known' ? '✓' : node.status === 'learning' ? '◐' : '✓'}
            </button>
          )}
          <span className={'flex-1 text-sm ' + (node.status === 'known' && !hasChildren ? 'text-gray-400 line-through' : 'text-gray-700')}>{node.title}</span>
          {hasChildren && <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium ' + badge}>{p}%</span>}
          {canChild && <button title="Add sub-goal" onClick={() => { setAdding(node.id); setDraft(''); }} className="text-teal-500"><Plus size={14} /></button>}
          <button onClick={() => persist(removeNode(roots, node.id))} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
        {adding === node.id && (
          <div className="flex gap-2 mt-1 ml-6">
            <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAdd(node.id)} placeholder="Sub-skill / sub-goal…" className="flex-1 px-2 py-1 text-sm rounded border border-gray-200" />
            <button onClick={() => submitAdd(node.id)} className="text-teal-600 text-sm font-medium">add</button>
          </div>
        )}
        <div className="ml-3 border-l border-dashed border-gray-200 pl-1">{node.children.map(c => renderNode(c, depth + 1))}</div>
      </div>
    );
  };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-800 text-sm">🌳 {title}</h3>
        <button onClick={() => { setAdding('root'); setDraft(''); }} className="text-teal-600 text-xs flex items-center gap-1"><Plus size={12} /> Add</button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: overall + '%' }} /></div>
        <span className="text-xs font-medium text-gray-600">{overall}%</span>
      </div>
      <p className="text-[10px] text-gray-400 mb-2">○ to-learn · ◐ learning · ✓ known · (Parent nodes auto-calculate % from children)</p>
      {adding === 'root' && (
        <div className="flex gap-2 mb-2">
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAdd(null)} placeholder="Top-level goal / category…" className="flex-1 px-2 py-1 text-sm rounded border border-gray-200" />
          <button onClick={() => submitAdd(null)} className="text-teal-600 text-sm font-medium">add</button>
        </div>
      )}
      {roots.length === 0 && adding !== 'root' && <p className="text-gray-400 text-xs py-2">Nothing here yet — add your first goal and branch it up to 10 levels deep!</p>}
      {roots.map(r => renderNode(r, 0))}
    </div>
  );
}
