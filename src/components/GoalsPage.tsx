import { useState } from 'react';
import { Plus, Trash2, Pause, Play, Check, RotateCcw } from 'lucide-react';

type Leaf = 'unknown' | 'learning' | 'known';
type Board = 'active' | 'hold' | 'done';
interface Node { id: string; title: string; status: Leaf; children: Node[]; }
interface GoalRoot extends Node { board: Board; completedAt?: string; }
const MAX_DEPTH = 10;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const WEIGHT: Record<Leaf, number> = { unknown: 0, learning: 0.5, known: 1 };
const save = (v: GoalRoot[]) => localStorage.setItem('romo-goals-board', JSON.stringify(v));
const migrateNodes = (ns: any[]): Node[] => (ns || []).map(n => ({ id: n.id || uid(), title: n.title, status: n.status || (n.completed ? 'known' : 'unknown'), children: migrateNodes(n.children) }));
function loadBoard(): GoalRoot[] {
  try {
    const raw = localStorage.getItem('romo-goals-board');
    if (raw) return JSON.parse(raw) as GoalRoot[];
    const old = localStorage.getItem('romo-goals');
    if (old) {
      const arr = JSON.parse(old);
      const roots: GoalRoot[] = (arr || []).map((g: any) => g.children
        ? { id: g.id || uid(), title: g.title, status: g.status || 'unknown', board: 'active' as Board, children: migrateNodes(g.children) }
        : { id: g.id || uid(), title: g.title || g.name || 'Goal', status: 'unknown' as Leaf, board: (g.completed ? 'done' : 'active') as Board, completedAt: g.completed ? new Date().toISOString().slice(0, 10) : undefined, children: (g.tasks || []).map((t: any) => ({ id: t.id || uid(), title: t.title, status: (t.completed ? 'known' : 'unknown') as Leaf, children: [] })) });
      save(roots);
      return roots;
    }
  } catch { /* ignore */ }
  return [];
}
function stats(n: Node): { score: number; total: number } {
  if (!n.children.length) return { score: WEIGHT[n.status], total: 1 };
  return n.children.reduce((a, c) => { const s = stats(c); return { score: a.score + s.score, total: a.total + s.total }; }, { score: 0, total: 0 });
}
const pctOf = (n: Node) => { const s = stats(n); return s.total ? Math.round((100 * s.score) / s.total) : 0; };
const nextStatus = (s: Leaf): Leaf => (s === 'unknown' ? 'learning' : s === 'learning' ? 'known' : 'unknown');
const mapTree = (ns: Node[], fn: (n: Node) => Node): Node[] => ns.map(n => fn({ ...n, children: mapTree(n.children, fn) }));
const addChild = (ns: Node[], pid: string, child: Node): Node[] => ns.map(n => n.id === pid ? { ...n, children: [...n.children, child] } : { ...n, children: addChild(n.children, pid, child) });
const removeNode = (ns: Node[], id: string): Node[] => ns.filter(n => n.id !== id).map(n => ({ ...n, children: removeNode(n.children, id) }));

export default function GoalsPage() {
  const [roots, setRoots] = useState<GoalRoot[]>(loadBoard);
  const [tab, setTab] = useState<Board>('active');
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const persist = (next: GoalRoot[]) => { setRoots(next); save(next); };
  const submitRoot = () => { if (!draft.trim()) return; persist([...roots, { id: uid(), title: draft.trim(), status: 'unknown', board: tab === 'done' ? 'active' : tab, children: [] }]); setDraft(''); };
  const submitChild = (pid: string) => { if (!draft.trim()) return; persist(roots.map(r => ({ ...r, children: addChild(r.children, pid, { id: uid(), title: draft.trim(), status: 'unknown', children: [] }) }))); setDraft(''); setAdding(null); };
  const submitChildRoot = (rid: string) => { if (!draft.trim()) return; persist(roots.map(r => r.id === rid ? { ...r, children: [...r.children, { id: uid(), title: draft.trim(), status: 'unknown' as Leaf, children: [] }] } : r)); setDraft(''); setAdding(null); };
  const setBoard = (id: string, board: Board) => persist(roots.map(r => r.id === id ? { ...r, board, completedAt: board === 'done' ? new Date().toISOString().slice(0, 10) : undefined } : r));
  const counts = { active: roots.filter(r => r.board === 'active').length, hold: roots.filter(r => r.board === 'hold').length, done: roots.filter(r => r.board === 'done').length };
  const renderNode = (rootId: string, node: Node, depth: number) => {
    const p = pctOf(node);
    const hasKids = node.children.length > 0;
    const agg: Leaf = hasKids ? (p === 100 ? 'known' : p > 0 ? 'learning' : 'unknown') : node.status;
    const dot = agg === 'known' ? 'bg-emerald-400 border-emerald-400 text-white' : agg === 'learning' ? 'bg-amber-300 border-amber-300 text-amber-800' : 'border-gray-300 text-transparent';
    return (
      <div key={node.id} style={{ marginLeft: depth ? 12 : 0 }} className="mt-1">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 border bg-white border-gray-100">
          {hasKids ? (
            <span className={'w-5 h-5 shrink-0 rounded-full border text-[10px] flex items-center justify-center ' + dot}>{agg === 'known' ? '✓' : agg === 'learning' ? '◐' : ''}</span>
          ) : (
            <button onClick={() => persist(roots.map(r => r.id === rootId ? { ...r, children: mapTree(r.children, n => n.id === node.id ? { ...n, status: nextStatus(n.status) } : n) } : r))} className={'w-5 h-5 shrink-0 rounded-full border text-[10px] flex items-center justify-center ' + dot}>✓</button>
          )}
          <span className={'flex-1 text-sm ' + (agg === 'known' && !hasKids ? 'text-gray-400 line-through' : 'text-gray-700')}>{node.title}</span>
          {hasKids && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{p}%</span>}
          {depth + 1 < MAX_DEPTH && <button title="Add sub-goal" onClick={() => { setAdding(node.id); setDraft(''); }} className="text-teal-500"><Plus size={14} /></button>}
          {depth > 0 && <button onClick={() => persist(roots.map(r => r.id === rootId ? { ...r, children: removeNode(r.children, node.id) } : r))} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>}
        </div>
        {adding === node.id && (
          <div className="flex gap-2 mt-1 ml-6">
            <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitChild(node.id)} placeholder="Sub-goal…" className="flex-1 px-2 py-1 text-sm rounded border border-gray-200" />
            <button onClick={() => submitChild(node.id)} className="text-teal-600 text-sm font-medium">add</button>
          </div>
        )}
        <div className="ml-3 border-l border-dashed border-gray-200 pl-1">{node.children.map(c => renderNode(rootId, c, depth + 1))}</div>
      </div>
    );
  };
  const tabBtn = (b: Board, label: string, n: number, cls: string) => (
    <button key={b} onClick={() => setTab(b)} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (tab === b ? cls : 'bg-white text-gray-500 border border-gray-200')}>{label} ({n})</button>
  );
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-5 border border-indigo-200">
        <h2 className="text-lg font-semibold text-indigo-800">🎯 Goals Board</h2>
        <p className="text-xs text-indigo-700 mt-1">Trello-style: park goals On Hold, finish them to move to Completed. Each goal nests 10 levels deep.</p>
      </div>
      <div className="flex gap-2">
        {tabBtn('active', '▶ Active', counts.active, 'bg-teal-500 text-white')}
        {tabBtn('hold', '⏸ On Hold', counts.hold, 'bg-amber-400 text-white')}
        {tabBtn('done', '✓ Completed', counts.done, 'bg-emerald-500 text-white')}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitRoot()} placeholder="New goal for this column…" className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        <button onClick={submitRoot} className="bg-indigo-500 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1"><Plus size={14} /> Add</button>
      </div>
      {roots.filter(r => r.board === tab).map(r => {
        const p = pctOf(r);
        return (
          <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <p className={'font-semibold text-gray-800 text-sm ' + (r.board === 'done' ? 'line-through text-gray-400' : '')}>{r.title}</p>
              <div className="flex gap-1">
                {r.board === 'active' && <button title="Put on hold" onClick={() => setBoard(r.id, 'hold')} className="text-amber-400"><Pause size={14} /></button>}
                {r.board === 'hold' && <button title="Resume" onClick={() => setBoard(r.id, 'active')} className="text-teal-500"><Play size={14} /></button>}
                {r.board !== 'done' && <button title="Mark completed" onClick={() => setBoard(r.id, 'done')} className="text-emerald-500"><Check size={14} /></button>}
                {r.board === 'done' && <button title="Reopen" onClick={() => setBoard(r.id, 'active')} className="text-gray-400"><RotateCcw size={14} /></button>}
                <button onClick={() => persist(roots.filter(x => x.id !== r.id))} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-400 rounded-full" style={{ width: p + '%' }} /></div>
              <span className="text-xs font-medium text-gray-600">{p}%</span>
            </div>
            {r.completedAt && <p className="text-[10px] text-emerald-600">Completed {r.completedAt} 🎉</p>}
            <div className="flex justify-end"><button onClick={() => { setAdding(r.id); setDraft(''); }} className="text-teal-600 text-xs flex items-center gap-1"><Plus size={12} /> sub-goal</button></div>
            {adding === r.id && (
              <div className="flex gap-2">
                <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitChildRoot(r.id)} placeholder="First sub-goal…" className="flex-1 px-2 py-1 text-sm rounded border border-gray-200" />
                <button onClick={() => submitChildRoot(r.id)} className="text-teal-600 text-sm font-medium">add</button>
              </div>
            )}
            {r.children.map(c => renderNode(r.id, c, 1))}
          </div>
        );
      })}
      {roots.filter(r => r.board === tab).length === 0 && <p className="text-gray-400 text-sm text-center py-6">Nothing in this column — add a goal above! 🌱</p>}
    </div>
  );
}
