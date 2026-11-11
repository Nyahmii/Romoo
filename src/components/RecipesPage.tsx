import { useState } from 'react';
import { Search, ChefHat, Trash2, ChevronDown, ChevronUp, Plus, Check, Download, ExternalLink, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { CapacitorHttp } from '@capacitor/core';

interface BoxRecipe {
  id: string; name: string; emoji: string; image?: string;
  ingredients: string[]; instructions: string[]; category: string; source?: string; savedAt: string;
}
const PAGE_SIZE = 9;
const CATEGORIES = ['Beef', 'Breakfast', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian'];
const AREAS = ['American', 'British', 'Caribbean', 'Chinese', 'Dutch', 'Egyptian', 'French', 'Greek', 'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican', 'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai', 'Turkish', 'Vietnamese'];

const loadBox = (): BoxRecipe[] => { try { return JSON.parse(localStorage.getItem('romo-recipe-box') || '[]'); } catch { return []; } };

async function fetchPageHtml(url: string): Promise<string> {
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const res = await CapacitorHttp.get({ url, headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Romo/1.5)' } });
    return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  }
  const r = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
  if (!r.ok) throw new Error('proxy failed');
  return await r.text();
}
function findRecipeNode(node: any): any | null {
  if (!node || typeof node !== 'object') return null;
  const t = node['@type'];
  if (t && (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe')))) return node;
  if (Array.isArray(node)) { for (const n of node) { const r = findRecipeNode(n); if (r) return r; } }
  if (node['@graph']) { const r = findRecipeNode(node['@graph']); if (r) return r; }
  return null;
}
function extractRecipe(html: string): any | null {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  for (const b of blocks) { let j: any = null; try { j = JSON.parse(b.trim()); } catch { continue; } const f = findRecipeNode(j); if (f) return f; }
  return null;
}
function mealToBox(m: any): BoxRecipe {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) { const ing = m['strIngredient' + i]; const meas = m['strMeasure' + i]; if (ing && ing.trim()) ingredients.push((meas && meas.trim() ? meas.trim() + ' ' : '') + ing.trim()); }
  return {
    id: 'web-' + m.idMeal, name: m.strMeal, emoji: '🍽️', image: m.strMealThumb, ingredients,
    instructions: String(m.strInstructions || '').split(/\r?\n/).filter((l: string) => l.trim()),
    category: m.strCategory || 'web', source: m.strSource || '', savedAt: new Date().toISOString(),
  };
}
function normalizeRecipe(node: any, url: string): BoxRecipe {
  const ingredients = (node.recipeIngredient || node.ingredients || []).map((x: any) => String(x).trim()).filter(Boolean);
  let instructions: string[] = [];
  const ri = node.recipeInstructions;
  if (typeof ri === 'string') instructions = ri.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
  else if (Array.isArray(ri)) instructions = ri.map((s: any) => (typeof s === 'string' ? s : s.text || '')).map((s: string) => s.trim()).filter(Boolean);
  const img = typeof node.image === 'string' ? node.image : Array.isArray(node.image) ? String(node.image[0] || '') : '';
  return { id: 'import-' + Date.now(), name: String(node.name || 'Imported recipe').trim(), emoji: '🍽️', image: img, ingredients, instructions, category: String(node.recipeCategory || 'imported').replace(/,/g, ' '), source: url, savedAt: new Date().toISOString() };
}

export default function RecipesPage(_props?: any) {
  const [tab, setTab] = useState<'web' | 'box'>('web');
  const [query, setQuery] = useState('');
  const [browseType, setBrowseType] = useState<'c' | 'a'>('c');
  const [browseVal, setBrowseVal] = useState('Dessert');
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [searchNote, setSearchNote] = useState('');
  const [searching, setSearching] = useState(false);
  const [detailCache, setDetailCache] = useState<Record<string, BoxRecipe>>({});
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [preview, setPreview] = useState<BoxRecipe | null>(null);
  const [box, setBox] = useState<BoxRecipe[]>(loadBox);
  const [open, setOpen] = useState<string | null>(null);

  const persistBox = (next: BoxRecipe[]) => { setBox(next); localStorage.setItem('romo-recipe-box', JSON.stringify(next)); };
  const inBox = (id: string) => box.some(b => b.id === id);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const searchWeb = async () => {
    if (!query.trim()) return;
    setSearching(true); setSearchNote(''); setPage(1);
    try {
      const words = [query.trim(), ...query.trim().split(/\s+/).filter(w => w.length > 2 && w.toLowerCase() !== query.trim().toLowerCase())];
      let found: any[] = [];
      for (const w of words) {
        const r = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=' + encodeURIComponent(w));
        const j = await r.json();
        if (j.meals && j.meals.length) { found = j.meals; if (w !== query.trim()) setSearchNote('No exact match — showing results for "' + w + '"'); break; }
      }
      setResults(found);
    } catch { setResults([]); }
    setSearching(false);
  };

  const browse = async () => {
    setSearching(true); setSearchNote(''); setPage(1);
    try {
      const r = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?' + browseType + '=' + encodeURIComponent(browseVal));
      const j = await r.json();
      setResults(j.meals || []);
      setSearchNote((j.meals || []).length + ' recipes found — flip through the pages!');
    } catch { setResults([]); }
    setSearching(false);
  };

  const ensureDetail = async (m: any): Promise<BoxRecipe> => {
    if (m.strIngredient1) return mealToBox(m);
    if (detailCache[m.idMeal]) return detailCache[m.idMeal];
    const r = await fetch('https://www.themealdb.com/api/json/v1/1/lookup.php?i=' + m.idMeal);
    const j = await r.json();
    const rec = mealToBox(j.meals[0]);
    setDetailCache(c => ({ ...c, [m.idMeal]: rec }));
    return rec;
  };

  const toggleOpen = async (m: any) => {
    if (open === m.idMeal) { setOpen(null); return; }
    setOpen(m.idMeal);
    if (!m.strIngredient1 && !detailCache[m.idMeal]) { try { await ensureDetail(m); } catch { /* ignore */ } }
  };

  const saveMeal = async (m: any) => {
    const rec = await ensureDetail(m);
    if (!inBox(rec.id)) persistBox([rec, ...box]);
  };

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url.startsWith('http')) { setImportError('Paste the full recipe URL (starting with http…)'); return; }
    setImporting(true); setImportError(''); setPreview(null);
    try {
      const html = await fetchPageHtml(url);
      const node = extractRecipe(html);
      if (!node) { setImportError('No clean recipe data found on that page. Tip: try the cooked.wiki trick — open cooked.wiki/YOUR-URL in a browser — or pick a different site.'); return; }
      setPreview(normalizeRecipe(node, url));
    } catch { setImportError('That site blocked the fetch from desktop. It usually works on the phone build — or try another URL.'); }
    finally { setImporting(false); }
  };

  const savePreview = () => {
    if (!preview) return;
    if (!box.some(b => b.source === preview.source)) persistBox([preview, ...box]);
    setPreview(null); setImportUrl('');
  };

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
        <p className="text-xs text-amber-700 mt-1">Search the web, browse by category or region, and build your own recipe box!</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('web')} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'web' ? 'bg-teal-500 text-white' : 'bg-white text-gray-500 border border-gray-200')}>🌐 Discover</button>
        <button onClick={() => setTab('box')} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'box' ? 'bg-rose-500 text-white' : 'bg-white text-gray-500 border border-gray-200')}>📦 My Box ({box.length})</button>
      </div>

      {tab === 'web' && (
        <>
          <div className="flex gap-2">
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') searchWeb(); }} placeholder="Search (e.g. chicken, pasta, soup…)" className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
            <button onClick={searchWeb} className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1"><Search size={14} /> Go</button>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-2">
            <Globe size={14} className="text-teal-500 shrink-0" />
            <select value={browseType} onChange={e => { setBrowseType(e.target.value as 'c' | 'a'); setBrowseVal(e.target.value === 'c' ? 'Dessert' : 'Italian'); }} className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
              <option value="c">Category</option>
              <option value="a">Region</option>
            </select>
            <select value={browseVal} onChange={e => setBrowseVal(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
              {(browseType === 'c' ? CATEGORIES : AREAS).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <button onClick={browse} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Browse</button>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-teal-100 space-y-2">
            <p className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Download size={14} className="text-teal-500" /> 🧼 Ad-free import — paste ANY recipe URL</p>
            <p className="text-[11px] text-gray-400">Strips ads, pop-ups & life stories: keeps only ingredients + steps. Works with AllRecipes, NYT, food blogs…</p>
            <div className="flex gap-2">
              <input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://…/recipes/some-dish" className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <button onClick={handleImport} className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm">{importing ? '…' : 'Import'}</button>
            </div>
            {importError && <p className="text-xs text-rose-500">{importError}</p>}
            {preview && (
              <div className="border border-teal-200 rounded-xl p-3 space-y-2 bg-teal-50/40">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-800 text-sm">{preview.emoji} {preview.name}</p>
                  <button onClick={savePreview} className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus size={12} /> Save to My Box</button>
                </div>
                <p className="text-[10px] text-gray-500">{preview.ingredients.length} ingredients • {preview.instructions.length} steps</p>
                <Detail r={preview} />
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <a href="https://cooked.wiki" target="_blank" rel="noreferrer" className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">cooked.wiki <ExternalLink size={10} /></a>
              <a href="https://www.jennycancook.com" target="_blank" rel="noreferrer" className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">Jenny Can Cook <ExternalLink size={10} /></a>
            </div>
            <p className="text-[10px] text-gray-400">Credits & inspiration: TheMealDB (search) • Honest Recipes, Recifix, Ad-Free Cook & Jenny Can Cook (ad-free cooking) • RecipeStripper & cooked.wiki (URL stripping tricks) 💛</p>
          </div>

          {searching && <p className="text-center text-gray-400 text-sm py-8 animate-pulse">Fetching recipes…</p>}
          {searchNote && !searching && <p className="text-xs text-amber-600 text-center">{searchNote}</p>}

          {results.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={'flex items-center gap-1 text-xs px-2 py-1 rounded-lg ' + (page <= 1 ? 'text-gray-300' : 'text-teal-600 hover:bg-teal-50')}><ChevronLeft size={14} /> Prev</button>
              <p className="text-xs text-gray-500">Page {page} of {totalPages} • {results.length} recipes</p>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={'flex items-center gap-1 text-xs px-2 py-1 rounded-lg ' + (page >= totalPages ? 'text-gray-300' : 'text-teal-600 hover:bg-teal-50')}>Next <ChevronRight size={14} /></button>
            </div>
          )}

          {pageItems.map(m => (
            <div key={m.idMeal} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <img src={m.strMealThumb} alt={m.strMeal} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{m.strMeal}</p>
                  <p className="text-[10px] text-gray-400">tap ⌄ for ingredients & steps</p>
                </div>
                <div className="flex gap-2">
                  <button title="Save to My Box" onClick={() => saveMeal(m)} className={inBox('web-' + m.idMeal) ? 'text-emerald-500' : 'text-gray-300 hover:text-teal-500'}>{inBox('web-' + m.idMeal) ? <Check size={16} /> : <Plus size={16} />}</button>
                  <button onClick={() => toggleOpen(m)} className="text-gray-400">{open === m.idMeal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                </div>
              </div>
              {open === m.idMeal && (detailCache[m.idMeal] || m.strIngredient1 ? <Detail r={detailCache[m.idMeal] || mealToBox(m)} /> : <p className="text-xs text-gray-400 mt-2 animate-pulse">Loading details…</p>)}
            </div>
          ))}
        </>
      )}

      {tab === 'box' && box.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Your recipe box is empty — discover recipes on the 🌐 tab and tap + to save them here! 📦</p>}
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
