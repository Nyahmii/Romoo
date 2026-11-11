import { useState } from 'react';
import { Search, ChefHat, Trash2, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';
import { recipes as builtIn } from '../data/recipes';
import type { Recipe } from '../types';

interface BoxRecipe {
  id: string; name: string; emoji: string; image?: string;
  ingredients: string[]; instructions: string[]; category: string; source?: string; savedAt: string;
}

const loadBox = (): BoxRecipe[] => { try { return JSON.parse(localStorage.getItem('romo-recipe-box') || '[]'); } catch { return []; } };

export default function RecipesPage(_props?: any) {
  const [tab, setTab] = useState<'builtin' | 'web' | 'box'>('builtin');
  const [query, setQuery] = useState('');
  const [webResults, setWebResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [box, setBox] = useState<BoxRecipe[]>(loadBox);
  const [open, setOpen] = useState<string | null>(null);

  const persistBox = (next: BoxRecipe[]) => { setBox(next); localStorage.setItem('romo-recipe-box', JSON.stringify(next)); };
  const inBox = (id: string) => box.some(b => b.id === id);

  const searchWeb = async () => {
    if (!query.trim()) return;
    setSearching(true); setWebResults(null);
    try {
      const r = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=' + encodeURIComponent(query.trim()));
      const j = await r.json();
      setWebResults(j.meals || []);
    } catch { setWebResults([]); }
    setSearching(false);
  };

  const saveWeb = (m: any) => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ing = m['strIngredient' + i]; const meas = m['strMeasure' + i];
      if (ing && ing.trim()) ingredients.push((meas && meas.trim() ? meas.trim() + ' ' : '') + ing.trim());
    }
    const rec: BoxRecipe = {
      id: 'web-' + m.idMeal, name: m.strMeal, emoji: '🍽️', image: m.strMealThumb, ingredients,
      instructions: String(m.strInstructions || '').split(/\r?\n/).filter(l => l.trim()),
      category: m.strCategory || 'web', source: m.strSource || '', savedAt: new Date().toISOString(),
    };
    if (!inBox(rec.id)) persistBox([rec, ...box]);
  };

  const saveBuiltIn = (r: Recipe) => {
    const rec: BoxRecipe = { id: 'local-' + r.id, name: r.name, emoji: r.emoji, ingredients: r.ingredients, instructions: r.instructions, category: r.category, savedAt: new Date().toISOString() };
    if (!inBox(rec.id)) persistBox([rec, ...box]);
  };

  const filteredBuiltIn = builtIn.filter(r => !query.trim() || r.name.toLowerCase().includes(query.toLowerCase()) || r.tags.some(t => t.includes(query.toLowerCase())));

  const Detail = ({ r }: { r: BoxRecipe }) => (
    <div className="mt-2 space-y-2">
      {r.image && <img src={r.image} alt={r.name} className="w-full h-40 object-cover rounded-xl" />}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Ingredients</p>
        <ul className="text-xs text-gray-600 space-y-0.5 list-disc pl-4">{r.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}</ul>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Steps</p>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">{r.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>
      {r.source && <a href={r.source} target="_blank" rel="noreferrer" className="text-xs text-teal-600 underline block">Original source ↗</a>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-5 border border-amber-200">
        <h2 className="text-lg font-semibold text-amber-800 flex items-center gap-2"><ChefHat size={18} /> Recipes</h2>
        <p className="text-xs text-amber-700 mt-1">Browse built-ins, search real recipes from the web, and save favorites to your box!</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('builtin')} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'builtin' ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 border border-gray-200')}>🍲 Built-in</button>
        <button onClick={() => setTab('web')} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'web' ? 'bg-teal-500 text-white' : 'bg-white text-gray-500 border border-gray-200')}>🌐 Web search</button>
        <button onClick={() => setTab('box')} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'box' ? 'bg-rose-500 text-white' : 'bg-white text-gray-500 border border-gray-200')}>📦 My Box ({box.length})</button>
      </div>

      {tab !== 'box' && (
        <div className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tab === 'web') searchWeb(); }} placeholder={tab === 'web' ? 'Search the web (e.g. chicken, pasta…)' : 'Filter built-in recipes…'} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
          {tab === 'web' && <button onClick={searchWeb} className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1"><Search size={14} /> Go</button>}
        </div>
      )}

      {tab === 'builtin' && filteredBuiltIn.map(r => (
        <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">{r.emoji} {r.name}</p>
            <div className="flex gap-2">
              <button title="Save to My Box" onClick={() => saveBuiltIn(r)} className={inBox('local-' + r.id) ? 'text-emerald-500' : 'text-gray-300 hover:text-amber-500'}>{inBox('local-' + r.id) ? <Check size={16} /> : <Plus size={16} />}</button>
              <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-gray-400">{open === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{r.description}</p>
          <p className="text-[10px] text-gray-400 mt-1 capitalize">{r.category} • prep {r.prepTime}min • cook {r.cookTime}min</p>
          {open === r.id && <Detail r={{ id: 'local-' + r.id, name: r.name, emoji: r.emoji, ingredients: r.ingredients, instructions: r.instructions, category: r.category, savedAt: '' }} />}
        </div>
      ))}

      {tab === 'web' && searching && <p className="text-center text-gray-400 text-sm py-8 animate-pulse">Searching the web…</p>}
      {tab === 'web' && webResults !== null && webResults.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No results — try another dish name! 🍳</p>}
      {tab === 'web' && (webResults || []).map(m => (
        <div key={m.idMeal} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <img src={m.strMealThumb} alt={m.strMeal} className="w-14 h-14 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="font-medium text-gray-800 text-sm">{m.strMeal}</p>
              <p className="text-[10px] text-gray-400 capitalize">{m.strCategory} • {m.strArea}</p>
            </div>
            <div className="flex gap-2">
              <button title="Save to My Box" onClick={() => saveWeb(m)} className={inBox('web-' + m.idMeal) ? 'text-emerald-500' : 'text-gray-300 hover:text-teal-500'}>{inBox('web-' + m.idMeal) ? <Check size={16} /> : <Plus size={16} />}</button>
              <button onClick={() => setOpen(open === m.idMeal ? null : m.idMeal)} className="text-gray-400">{open === m.idMeal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            </div>
          </div>
        </div>
      ))}

      {tab === 'box' && box.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Your recipe box is empty — tap the + on any recipe to save it here! 📦</p>}
      {tab === 'box' && box.map(r => (
        <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">{r.emoji} {r.name}</p>
            <div className="flex gap-2">
              <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-gray-400">{open === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
              <button onClick={() => persistBox(box.filter(b => b.id !== r.id))} className="text-gray-300 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 capitalize">saved {new Date(r.savedAt).toLocaleDateString()} • {r.category}</p>
          {open === r.id && <Detail r={r} />}
        </div>
      ))}
    </div>
  );
}
