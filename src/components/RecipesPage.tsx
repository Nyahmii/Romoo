import { useState, useEffect } from 'react';
import { Search, ChefHat, Trash2, ChevronDown, ChevronUp, Plus, Check, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { CapacitorHttp } from '@capacitor/core';

interface BoxRecipe {
  id: string; name: string; emoji: string; image?: string;
  ingredients: string[]; instructions: string[]; category: string; source?: string; savedAt: string;
}
interface UniMeal { src: 'tmd' | 'dj'; id: string; name: string; image: string; ingredients: string[]; instructions: string[]; category: string; area: string; tags: string[]; }
type Diet = 'all' | 'vegan' | 'vegetarian' | 'glutenfree' | 'dairyfree' | 'nutfree' | 'eggfree';
const PAGE_SIZE = 9;
const TMD = 'https://www.themealdb.com/api/json/v1/1/';
const CATEGORIES = ['Beef', 'Breakfast', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian'];
const AREAS = ['American', 'British', 'Caribbean', 'Chinese', 'Dutch', 'Egyptian', 'French', 'Greek', 'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican', 'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai', 'Turkish', 'Vietnamese'];
const MEAT = ['chicken', 'beef', 'pork', 'lamb', 'goat', 'venison', 'turkey', 'duck', 'goose', 'bacon', 'ham', 'sausage', 'pepperoni', 'salmon', 'tuna', 'fish', 'cod', 'haddock', 'trout', 'sardine', 'anchov', 'shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'squid', 'calamari', 'gelatin', 'lard'];
const DAIRY = ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'ghee', 'whey', 'casein', 'buttermilk', 'mozzarella', 'parmesan', 'cheddar', 'curd'];
const EGG = ['egg', 'mayonnaise', 'mayo', 'aioli'];
const NUT = ['nut', 'peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'tahini', 'sesame', 'marzipan'];
const GLUTEN = ['wheat', 'flour', 'pasta', 'spaghetti', 'noodle', 'bread', 'breadcrumb', 'barley', 'rye', 'semolina', 'couscous', 'bulgur', 'seitan', 'soy sauce', 'soysauce', 'malt', 'beer', 'cracker', 'pastry', 'dough'];
const HONEY = ['honey'];
const low = (s: string) => s.toLowerCase();
const hasAny = (ings: string[], words: string[]) => ings.some(i => { const s = low(i); return words.some(w => s.includes(w)); });
const isVegan = (ings: string[]) => ings.length > 0 && !hasAny(ings, MEAT.concat(DAIRY, EGG, HONEY));
const isVegetarian = (ings: string[]) => ings.length > 0 && !hasAny(ings, MEAT);
const isGlutenFree = (ings: string[]) => ings.length > 0 && !hasAny(ings, GLUTEN);
const isDairyFree = (ings: string[]) => ings.length > 0 && !hasAny(ings, DAIRY);
const isNutFree = (ings: string[]) => ings.length > 0 && !hasAny(ings, NUT);
const isEggFree = (ings: string[]) => ings.length > 0 && !hasAny(ings, EGG);

const loadBox = (): BoxRecipe[] => { try { return JSON.parse(localStorage.getItem('romo-recipe-box') || '[]'); } catch { return []; } };
const ingOfMeal = (m: any): string[] => { const out: string[] = []; for (let i = 1; i <= 20; i++) { const ing = m['strIngredient' + i]; const meas = m['strMeasure' + i]; if (ing && ing.trim()) out.push((meas && meas.trim() ? meas.trim() + ' ' : '') + ing.trim()); } return out; };

let djCache: UniMeal[] | null = null;
async function fetchDJ(): Promise<UniMeal[]> {
  if (djCache) return djCache;
  try {
    const r = await fetch('https://dummyjson.com/recipes?limit=0');
    const j = await r.json();
    djCache = (j.recipes || []).map((r: any) => ({ src: 'dj' as const, id: 'dj-' + r.id, name: r.name, image: r.image || '', ingredients: (r.ingredients || []).map(String), instructions: (r.instructions || []).map(String), category: (r.tags && r.tags[0]) || '', area: r.cuisine || '', tags: r.tags || [] }));
    return djCache;
  } catch { return []; }
}
async function fetchTMDBase(query: string, selCat: string, selArea: string, selIng: string): Promise<UniMeal[]> {
  const toUni = (m: any): UniMeal => ({ src: 'tmd' as const, id: m.idMeal, name: m.strMeal, image: m.strMealThumb || '', ingredients: ingOfMeal(m), instructions: String(m.strInstructions || '').split(/\r?\n/).filter((l: string) => l.trim()), category: m.strCategory || '', area: m.strArea || '', tags: [] });
  try {
    if (query) {
      const words = [query, ...query.split(/\s+/).filter(w => w.length > 2 && low(w) !== low(query))];
      for (const w of words) { const r = await fetch(TMD + 'search.php?s=' + encodeURIComponent(w)); const j = await r.json(); if (j.meals && j.meals.length) return j.meals.map(toUni); }
      return [];
    }
    if (selIng) { const r = await fetch(TMD + 'filter.php?i=' + encodeURIComponent(selIng)); const j = await r.json(); return (j.meals || []).map(toUni); }
    if (selCat !== 'Any') { const r = await fetch(TMD + 'filter.php?c=' + encodeURIComponent(selCat)); const j = await r.json(); return (j.meals || []).map(toUni); }
    if (selArea !== 'Any') { const r = await fetch(TMD + 'filter.php?a=' + encodeURIComponent(selArea)); const j = await r.json(); return (j.meals || []).map(toUni); }
    const out: UniMeal[] = [];
    for (let i = 0; i < CATEGORIES.length; i += 6) {
      const chunk = CATEGORIES.slice(i, i + 6);
      const rs = await Promise.all(chunk.map(c => fetch(TMD + 'filter.php?c=' + encodeURIComponent(c)).then(r => r.json()).catch(() => null)));
      rs.forEach(j => { if (j && j.meals) j.meals.forEach((m: any) => out.push(toUni(m))); });
    }
    return out;
  } catch { return []; }
}
async function fetchPageHtml(url: string): Promise<string> {
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const res = await CapacitorHttp.get({ url, headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Romo/1.7)' } });
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
  const [selCat, setSelCat] = useState('Any');
  const [selArea, setSelArea] = useState('Any');
  const [selIng, setSelIng] = useState('');
  const [ingList, setIngList] = useState<string[]>([]);
  const [diet, setDiet] = useState<Diet>('all');
  const [base, setBase] = useState<UniMeal[]>([]);
  const [cache, setCache] = useState<Record<string, UniMeal>>({});
  const [page, setPage] = useState(1);
  const [note, setNote] = useState('');
  const [searching, setSearching] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [preview, setPreview] = useState<BoxRecipe | null>(null);
  const [box, setBox] = useState<BoxRecipe[]>(loadBox);
  const [open, setOpen] = useState<string | null>(null);

  const persistBox = (next: BoxRecipe[]) => { setBox(next); localStorage.setItem('romo-recipe-box', JSON.stringify(next)); };
  const inBox = (m: UniMeal) => box.some(b => b.id === m.src + '-' + m.id);

  const ingsOf = (m: UniMeal): string[] => (m.ingredients.length ? m.ingredients : (cache[m.id] ? cache[m.id].ingredients : []));

  const matches = (m: UniMeal): boolean => {
    const ing = ingsOf(m);
    if (selCat !== 'Any') { const c = low(selCat); if (!(low(m.category).includes(c) || m.tags.some(t => low(t).includes(c)))) return false; }
    if (selArea !== 'Any') { if (!low(m.area).includes(low(selArea))) return false; }
    if (selIng) { if (!ing.some(i => low(i).includes(low(selIng)))) return false; }
    if (query && m.src === 'dj') { const q = low(query); if (!(low(m.name).includes(q) || ing.some(i => low(i).includes(q)) || m.tags.some(t => low(t).includes(q)))) return false; }
    if (diet === 'vegan') return isVegan(ing);
    if (diet === 'vegetarian') return isVegetarian(ing);
    if (diet === 'glutenfree') return isGlutenFree(ing);
    if (diet === 'dairyfree') return isDairyFree(ing);
    if (diet === 'nutfree') return isNutFree(ing);
    if (diet === 'eggfree') return isEggFree(ing);
    return true;
  };
  const filtered = base.filter(matches);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const enrich = async (meals: UniMeal[]) => {
    const need = meals.filter(m => m.src === 'tmd' && !m.ingredients.length && !cache[m.id]).slice(0, 120);
    if (!need.length) return;
    setEnriching(true);
    for (let i = 0; i < need.length; i += 10) {
      const chunk = need.slice(i, i + 10);
      await Promise.all(chunk.map(async m => {
        try {
          const r = await fetch(TMD + 'lookup.php?i=' + m.id);
          const j = await r.json();
          if (j.meals && j.meals[0]) setCache(c => ({ ...c, [m.id]: { ...m, ingredients: ingOfMeal(j.meals[0]), instructions: String(j.meals[0].strInstructions || '').split(/\r?\n/).filter((l: string) => l.trim()) } }));
        } catch { /* skip */ }
      }));
    }
    setEnriching(false);
  };

  const runFind = async () => {
    setSearching(true); setNote(''); setPage(1);
    const [tmd, dj] = await Promise.all([fetchTMDBase(query.trim(), selCat, selArea, selIng.trim()), fetchDJ()]);
    const seen = new Set<string>();
    const merged: UniMeal[] = [];
    [...tmd, ...dj].forEach(m => { const k = low(m.name); if (!seen.has(k)) { seen.add(k); merged.push(m); } });
    setBase(merged);
    setNote(merged.length + ' recipes found across both databases — all filters combine!');
    setSearching(false);
    enrich(merged);
  };

  useEffect(() => { runFind(); loadIngredients(); /* initial load */ }, []);

  const loadIngredients = async () => {
    if (ingList.length) return;
    try { const r = await fetch(TMD + 'list.php?i=list'); const j = await r.json(); setIngList((j.meals || []).map((x: any) => x.strIngredient).filter(Boolean)); } catch { /* ignore */ }
  };

  const ensureUni = async (m: UniMeal): Promise<UniMeal> => {
    if (m.ingredients.length) return m;
    if (cache[m.id]) return cache[m.id];
    const r = await fetch(TMD + 'lookup.php?i=' + m.id);
    const j = await r.json();
    const full = { ...m, ingredients: ingOfMeal(j.meals[0]), instructions: String(j.meals[0].strInstructions || '').split(/\r?\n/).filter((l: string) => l.trim()) };
    setCache(c => ({ ...c, [m.id]: full }));
    return full;
  };
  const saveMeal = async (m: UniMeal) => {
    const full = await ensureUni(m);
    const rec: BoxRecipe = { id: full.src + '-' + full.id, name: full.name, emoji: '🍽️', image: full.image, ingredients: full.ingredients, instructions: full.instructions, category: full.category || full.area || 'web', source: full.src === 'tmd' ? 'https://www.themealdb.com/meal.php?id=' + full.id : '', savedAt: new Date().toISOString() };
    if (!box.some(b => b.id === rec.id)) persistBox([rec, ...box]);
  };
  const toggleOpen = async (m: UniMeal) => {
    if (open === m.id) { setOpen(null); return; }
    setOpen(m.id);
    if (m.src === 'tmd' && !m.ingredients.length && !cache[m.id]) { try { await ensureUni(m); } catch { /* ignore */ } }
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

  const DIETS: { key: Diet; label: string; on: string }[] = [
    { key: 'all', label: 'All', on: 'bg-gray-700 text-white' },
    { key: 'vegan', label: '🌱 Vegan', on: 'bg-green-600 text-white' },
    { key: 'vegetarian', label: '🥦 Vegetarian', on: 'bg-emerald-500 text-white' },
    { key: 'glutenfree', label: '🌾 Gluten-free', on: 'bg-amber-500 text-white' },
    { key: 'dairyfree', label: '🥛 Dairy-free', on: 'bg-sky-500 text-white' },
    { key: 'nutfree', label: '🥜 Nut-free', on: 'bg-orange-500 text-white' },
    { key: 'eggfree', label: '🥚 Egg-free', on: 'bg-yellow-500 text-white' },
  ];

  const Detail = ({ r }: { r: { image?: string; ingredients: string[]; instructions: string[]; source?: string } }) => (
    <div className="mt-2 space-y-2">
      {r.image && <img src={r.image} alt="" className="w-full h-40 object-cover rounded-xl" />}
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
        <p className="text-xs text-amber-700 mt-1">Two recipe databases + ad-free imports — every filter combines in one search!</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('web')} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'web' ? 'bg-teal-500 text-white' : 'bg-white text-gray-500 border border-gray-200')}>🌐 Discover</button>
        <button onClick={() => setTab('box')} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (tab === 'box' ? 'bg-rose-500 text-white' : 'bg-white text-gray-500 border border-gray-200')}>📦 My Box ({box.length})</button>
      </div>

      {tab === 'web' && (
        <>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-2">
            <div className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runFind(); }} placeholder="Search (e.g. curry, soup, tofu…)" className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <button onClick={runFind} className="bg-teal-500 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1"><Search size={14} /> Find</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select value={selCat} onChange={e => setSelCat(e.target.value)} className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
                <option value="Any">Any category</option>
                {CATEGORIES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={selArea} onChange={e => setSelArea(e.target.value)} className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white">
                <option value="Any">Any region</option>
                {AREAS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <input list="inglist" value={selIng} onChange={e => setSelIng(e.target.value)} placeholder="Any ingredient" className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs" />
            </div>
            <datalist id="inglist">{ingList.map(i => <option key={i} value={i} />)}</datalist>
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-[10px] text-gray-400">Diet:</span>
              {DIETS.map(d => (
                <button key={d.key} onClick={() => { setDiet(d.key); setPage(1); }} className={'px-2.5 py-1 rounded-full text-[10px] font-medium ' + (diet === d.key ? d.on : 'bg-white text-gray-500 border border-gray-200')}>{d.label}</button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">All filters combine: search + category + region + ingredient + diet. Diet filters are ingredient-checking helpers — always double-check labels for allergies ⚠️</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-teal-100 space-y-2">
            <p className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Download size={14} className="text-teal-500" /> 🧼 Ad-free import — paste ANY recipe URL</p>
            <p className="text-[11px] text-gray-400">Perfect for sensitivity-friendly blogs: strips ads & life stories, keeps ingredients + steps.</p>
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
            <p className="text-[10px] text-gray-400">Credits: TheMealDB + DummyJSON open recipe data • Honest Recipes, Recifix, Ad-Free Cook & Jenny Can Cook (ad-free cooking) • RecipeStripper & cooked.wiki (stripping tricks) 💛</p>
          </div>

          {searching && <p className="text-center text-gray-400 text-sm py-8 animate-pulse">Searching both recipe databases…</p>}
          {enriching && <p className="text-center text-gray-400 text-xs animate-pulse">🔬 Checking ingredients against your filters…</p>}
          {!searching && note && <p className="text-xs text-amber-600 text-center">{note}</p>}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
              <button disabled={safePage <= 1} onClick={() => setPage(p => p - 1)} className={'flex items-center gap-1 text-xs px-2 py-1 rounded-lg ' + (safePage <= 1 ? 'text-gray-300' : 'text-teal-600 hover:bg-teal-50')}><ChevronLeft size={14} /> Prev</button>
              <p className="text-xs text-gray-500">Page {safePage} of {totalPages} • {filtered.length} matches</p>
              <button disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} className={'flex items-center gap-1 text-xs px-2 py-1 rounded-lg ' + (safePage >= totalPages ? 'text-gray-300' : 'text-teal-600 hover:bg-teal-50')}>Next <ChevronRight size={14} /></button>
            </div>
          )}
          {base.length > 0 && filtered.length === 0 && !enriching && <p className="text-center text-gray-400 text-sm py-8">Nothing matches this combination — loosen a filter, or import from a sensitivity-friendly site! 🌱</p>}

          {pageItems.map(m => {
            const ing = ingsOf(m);
            return (
              <div key={m.src + m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  {m.image ? <img src={m.image} alt={m.name} className="w-14 h-14 rounded-xl object-cover" /> : <span className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">🍽️</span>}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{m.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{m.area || m.category || 'web'}{m.tags.length ? ' • ' + m.tags.slice(0, 2).join(', ') : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button title="Save to My Box" onClick={() => saveMeal(m)} className={inBox(m) ? 'text-emerald-500' : 'text-gray-300 hover:text-teal-500'}>{inBox(m) ? <Check size={16} /> : <Plus size={16} />}</button>
                    <button onClick={() => toggleOpen(m)} className="text-gray-400">{open === m.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                  </div>
                </div>
                {open === m.id && (ing.length ? <Detail r={{ image: m.image, ingredients: ing, instructions: cache[m.id] ? cache[m.id].instructions : m.instructions }} /> : <p className="text-xs text-gray-400 mt-2 animate-pulse">Loading details…</p>)}
              </div>
            );
          })}
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
