import { useState, useEffect } from 'react';
import { Search, ChefHat, Trash2, ChevronDown, ChevronUp, Plus, Check, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { CapacitorHttp } from '@capacitor/core';

interface BoxRecipe {
  id: string; name: string; emoji: string; image?: string;
  ingredients: string[]; instructions: string[]; category: string; source?: string; savedAt: string;
}
interface UniMeal { src: 'tmd' | 'dj' | 'wb'; id: string; name: string; image: string; ingredients: string[]; instructions: string[]; category: string; area: string; tags: string[]; }
type Diet = 'all' | 'vegan' | 'vegetarian' | 'glutenfree' | 'dairyfree' | 'nutfree' | 'eggfree';
const PAGE_SIZE = 9;
const TMD = 'https://www.themealdb.com/api/json/v1/1/';
const WB = 'https://en.wikibooks.org/w/api.php?';
const CATEGORIES = ['Beef', 'Breakfast', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian'];
const AREAS = ['American', 'British', 'Caribbean', 'Chinese', 'Dutch', 'Egyptian', 'French', 'Greek', 'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican', 'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai', 'Turkish', 'Vietnamese'];
const MEAT = ['chicken', 'beef', 'pork', 'lamb', 'goat', 'venison', 'turkey', 'duck', 'goose', 'bacon', 'ham', 'sausage', 'pepperoni', 'salmon', 'tuna', 'fish', 'cod', 'haddock', 'trout', 'sardine', 'anchov', 'shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'squid', 'calamari', 'gelatin', 'lard'];
const DAIRY = ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'ghee', 'whey', 'casein', 'buttermilk', 'mozzarella', 'parmesan', 'cheddar', 'curd'];
const EGG = ['egg', 'mayonnaise', 'mayo', 'aioli'];
const NUT = ['nut', 'peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'tahini', 'sesame', 'marzipan'];
const GLUTEN = ['wheat', 'flour', 'pasta', 'spaghetti', 'noodle', 'bread', 'breadcrumb', 'barley', 'rye', 'semolina', 'couscous', 'bulgur', 'seitan', 'soy sauce', 'soysauce', 'malt', 'beer', 'cracker', 'pastry', 'dough'];
const HONEY = ['honey'];
const DIET_WORD: Record<Diet, string> = { all: '', vegan: 'vegan', vegetarian: 'vegetarian', glutenfree: 'gluten-free', dairyfree: 'dairy-free', nutfree: 'nut-free', eggfree: 'egg-free' };
const low = (s: string) => s.toLowerCase();
const hasAny = (ings: string[], words: string[]) => ings.some(i => { const s = low(i); return words.some(w => s.includes(w)); });
const isVegan = (ings: string[]) => ings.length > 0 && !hasAny(ings, MEAT.concat(DAIRY, EGG, HONEY));
const isVegetarian = (ings: string[]) => ings.length > 0 && !hasAny(ings, MEAT);
const isGlutenFree = (ings: string[]) => ings.length > 0 && !hasAny(ings, GLUTEN);
const isDairyFree = (ings: string[]) => ings.length > 0 && !hasAny(ings, DAIRY);
const isNutFree = (ings: string[]) => ings.length > 0 && !hasAny(ings, NUT);
const isEggFree = (ings: string[]) => ings.length > 0 && !hasAny(ings, EGG);

const dec = (s: string): string => { try { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; } catch { return s; } };
const cleanLine = (s: string) => dec(s).replace(/^[\s\u2022\u25a2\u25aa\u25ab\u2023\u2043▪▢•·]+/, '').trim();
const txt = (h: string) => cleanLine(h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
const loadBox = (): BoxRecipe[] => { try { return JSON.parse(localStorage.getItem('romo-recipe-box') || '[]'); } catch { return []; } };
const ingOfMeal = (m: any): string[] => { const out: string[] = []; for (let i = 1; i <= 20; i++) { const ing = m['strIngredient' + i]; const meas = m['strMeasure' + i]; if (ing && ing.trim()) out.push(cleanLine((meas ? meas.trim() + ' ' : '') + ing.trim())); } return out; };

function ogImage(html: string): string {
  const m = html.match(/<meta[^>]+property=["']og:image[:\w]*["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image[:\w]*["']/i)
    || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  return m ? m[1] : '';
}
function section(html: string, names: string[]): string[] {
  for (const n of names) {
    const re = new RegExp('<h[23][^>]*>\\s*(?:<span[^>]*>)?' + n + '(?:</span>)?\\s*</h[23]>([\\s\\S]*?)(?=<h[23]|$)', 'i');
    const m = html.match(re);
    if (m) {
      const lis = [...m[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(x => txt(x[1])).filter(Boolean);
      if (lis.length) return lis;
      const paras = m[1].split(/<\/?p[^>]*>/).map(p => txt(p)).filter(p => p.length > 10);
      if (paras.length > 1) return paras;
    }
  }
  return [];
}
function parseHTMLRecipe(html: string): { ingredients: string[]; instructions: string[]; image: string } {
  let image = ogImage(html);
  if (!image) { const im = html.match(/<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"']+)["']/i); image = im ? im[1] : ''; }
  return {
    ingredients: section(html, ['Ingredients']),
    instructions: section(html, ['Procedure', 'Instructions', 'Method', 'Directions', 'Preparation', 'Steps']),
    image,
  };
}
async function fetchWBDetails(title: string): Promise<{ ingredients: string[]; instructions: string[]; image: string }> {
  const r = await fetch(WB + 'action=parse&page=' + encodeURIComponent(title) + '&prop=text&format=json&origin=*');
  const j = await r.json();
  const html: string = (j.parse && j.parse.text && (j.parse.text['*'] || '')) || '';
  return parseHTMLRecipe(html);
}
async function fetchWB(q: string): Promise<UniMeal[]> {
  try {
    const r = await fetch(WB + 'action=query&list=search&srsearch=' + encodeURIComponent(q) + '&srnamespace=102&srlimit=15&format=json&origin=*');
    const j = await r.json();
    return ((j.query && j.query.search) || []).map((s: any) => ({ src: 'wb' as const, id: s.title, name: dec(s.title.replace(/^Cookbook:/, '').replace(/_/g, ' ')), image: '', ingredients: [], instructions: [], category: '', area: 'Wikibooks', tags: [] }));
  } catch { return []; }
}

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
  const toUni = (m: any): UniMeal => ({ src: 'tmd' as const, id: m.idMeal, name: m.strMeal, image: m.strMealThumb || '', ingredients: ingOfMeal(m), instructions: String(m.strInstructions || '').split(/\r?\n/).map(txt).filter(Boolean), category: m.strCategory || '', area: m.strArea || '', tags: [] });
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
    try { const lr = await fetch(TMD + 'latest.php'); const lj = await lr.json(); if (lj.meals) lj.meals.forEach((m: any) => out.push(toUni(m))); } catch { /* ignore */ }
    return out;
  } catch { return []; }
}
async function fetchPageHtml(url: string): Promise<string> {
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const res = await CapacitorHttp.get({ url, headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Romo/1.10)' } });
    return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  }
  const proxies = ['https://api.allorigins.win/raw?url=', 'https://corsproxy.io/?', 'https://api.codetabs.com/v1/proxy?quest='];
  for (const p of proxies) {
    try { const r = await fetch(p + encodeURIComponent(url)); if (r.ok) { const t = await r.text(); if (t && t.length > 200) return t; } } catch { /* next */ }
  }
  try { const r = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(url)); if (r.ok) { const j = await r.json(); if (j.contents) return j.contents; } } catch { /* ignore */ }
  throw new Error('fetch failed');
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
  const parsed = parseHTMLRecipe(html);
  if (parsed.ingredients.length || parsed.instructions.length) {
    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || html.match(/<title[^>]*>([^<]+)<\/title>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    return { name: titleMatch ? txt(titleMatch[1]).replace(/[-|–].*$/, '').trim() : 'Imported Recipe', recipeIngredient: parsed.ingredients, recipeInstructions: parsed.instructions, image: parsed.image };
  }
  return null;
}
function normalizeRecipe(node: any, url: string, fbImage?: string): BoxRecipe {
  const ingredients = (node.recipeIngredient || node.ingredients || []).map((x: any) => cleanLine(String(x))).filter(Boolean);
  let instructions: string[] = [];
  const ri = node.recipeInstructions;
  if (typeof ri === 'string') instructions = ri.split(/\r?\n/).map(txt).filter(Boolean);
  else if (Array.isArray(ri)) instructions = ri.map((s: any) => (typeof s === 'string' ? s : s.text || '')).map(txt).filter(Boolean);
  let img = typeof node.image === 'string' ? node.image : Array.isArray(node.image) ? String(node.image[0] || '') : (node.image && node.image.url ? String(node.image.url) : '');
  if (!img && fbImage) img = fbImage;
  return { id: 'import-' + Date.now(), name: cleanLine(String(node.name || 'Imported recipe')), emoji: '🍽️', image: img, ingredients, instructions, category: String(node.recipeCategory || 'imported').replace(/,/g, ' '), source: url, savedAt: new Date().toISOString() };
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
  const [scanned, setScanned] = useState(0);
  const [cache, setCache] = useState<Record<string, UniMeal>>({});
  const [page, setPage] = useState(1);
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
  const sourceOf = (m: UniMeal): string => (m.src === 'tmd' ? 'https://www.themealdb.com/meal.php?id=' + m.id : m.src === 'wb' ? 'https://en.wikibooks.org/wiki/' + encodeURIComponent(m.id) : '');

  const matches = (m: UniMeal): boolean => {
    const ing = ingsOf(m);
    if (m.src !== 'wb') {
      if (query) {
        const words = low(query).split(/\s+/).filter(w => w.length > 2);
        const hay = low(m.name) + ' ' + m.tags.map(low).join(' ') + ' ' + ing.map(low).join(' ');
        if (words.length && !words.some(w => hay.includes(w))) return false;
      }
      if (selCat !== 'Any') { const c = low(selCat); if (!(low(m.category).includes(c) || m.tags.some(t => low(t).includes(c)))) return false; }
      if (selArea !== 'Any') { if (!low(m.area).includes(low(selArea))) return false; }
    }
    if (selIng) { if (!ing.some(i => low(i).includes(low(selIng)))) return false; }
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

  const enrich = async (meals: UniMeal[], activeDiet: Diet, activeIng: string) => {
    const needT = meals.filter(m => m.src === 'tmd' && !m.ingredients.length && !cache[m.id]).slice(0, 120);
    const needW = (activeDiet !== 'all' || activeIng) ? meals.filter(m => m.src === 'wb' && !cache[m.id]).slice(0, 25) : [];
    if (!needT.length && !needW.length) return;
    setEnriching(true);
    for (let i = 0; i < needT.length; i += 10) {
      const chunk = needT.slice(i, i + 10);
      await Promise.all(chunk.map(async m => {
        try {
          const r = await fetch(TMD + 'lookup.php?i=' + m.id);
          const j = await r.json();
          if (j.meals && j.meals[0]) setCache(c => ({ ...c, [m.id]: { ...m, ingredients: ingOfMeal(j.meals[0]), instructions: String(j.meals[0].strInstructions || '').split(/\r?\n/).map(txt).filter(Boolean) } }));
        } catch { /* skip */ }
      }));
    }
    for (let i = 0; i < needW.length; i += 5) {
      const chunk = needW.slice(i, i + 5);
      await Promise.all(chunk.map(async m => {
        try { const d = await fetchWBDetails(m.id); setCache(c => ({ ...c, [m.id]: { ...m, ingredients: d.ingredients, instructions: d.instructions, image: d.image || m.image } })); } catch { /* skip */ }
      }));
    }
    setEnriching(false);
  };

  const runFind = async () => {
    setSearching(true); setPage(1);
    const q = query.trim();
    const wbQ = q || [DIET_WORD[diet], selCat !== 'Any' ? selCat : '', selArea !== 'Any' ? selArea : '', selIng.trim()].filter(Boolean).join(' ');
    const [tmd, dj, wb] = await Promise.all([fetchTMDBase(q, selCat, selArea, selIng.trim()), fetchDJ(), wbQ ? fetchWB(wbQ) : Promise.resolve([] as UniMeal[])]);
    const seen = new Set<string>();
    const merged: UniMeal[] = [];
    [...tmd, ...dj, ...wb].forEach(m => { const k = low(m.name); if (!seen.has(k)) { seen.add(k); merged.push(m); } });
    setBase(merged);
    setScanned(merged.length);
    setSearching(false);
    enrich(merged, diet, selIng.trim());
  };

  useEffect(() => { runFind(); loadIngredients(); /* initial load */ }, []);

  const loadIngredients = async () => {
    if (ingList.length) return;
    try { const r = await fetch(TMD + 'list.php?i=list'); const j = await r.json(); setIngList((j.meals || []).map((x: any) => x.strIngredient).filter(Boolean)); } catch { /* ignore */ }
  };

  const ensureUni = async (m: UniMeal): Promise<UniMeal> => {
    if (m.ingredients.length) return m;
    if (cache[m.id]) return cache[m.id];
    if (m.src === 'wb') {
      const d = await fetchWBDetails(m.id);
      const full = { ...m, ingredients: d.ingredients, instructions: d.instructions, image: d.image || m.image };
      setCache(c => ({ ...c, [m.id]: full }));
      return full;
    }
    const r = await fetch(TMD + 'lookup.php?i=' + m.id);
    const j = await r.json();
    const full = { ...m, ingredients: ingOfMeal(j.meals[0]), instructions: String(j.meals[0].strInstructions || '').split(/\r?\n/).map(txt).filter(Boolean) };
    setCache(c => ({ ...c, [m.id]: full }));
    return full;
  };
  const saveMeal = async (m: UniMeal) => {
    const full = await ensureUni(m);
    const rec: BoxRecipe = { id: full.src + '-' + full.id, name: full.name, emoji: full.src === 'wb' ? '📖' : '🍽️', image: full.image, ingredients: full.ingredients, instructions: full.instructions, category: full.category || full.area || 'web', source: sourceOf(full), savedAt: new Date().toISOString() };
    if (!box.some(b => b.id === rec.id)) persistBox([rec, ...box]);
  };
  const toggleOpen = async (m: UniMeal) => {
    if (open === m.id) { setOpen(null); return; }
    setOpen(m.id);
    if (!m.ingredients.length && !cache[m.id]) { try { await ensureUni(m); } catch { /* ignore */ } }
  };

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url.startsWith('http')) { setImportError('Paste the full recipe URL (starting with http…)'); return; }
    setImporting(true); setImportError(''); setPreview(null);
    try {
      let html = '';
      const wbM = url.match(/wikibooks\.org\/wiki\/([^?#]+)/);
      if (wbM) {
        const r = await fetch(WB + 'action=parse&page=' + encodeURIComponent(decodeURIComponent(wbM[1])) + '&prop=text&format=json&origin=*');
        const j = await r.json();
        html = (j.parse && j.parse.text && (j.parse.text['*'] || '')) || '';
        if (!html) throw new Error('wikibooks empty');
      } else {
        html = await fetchPageHtml(url);
      }
      const node = extractRecipe(html);
      if (!node) { setImportError('Could not find recipe data on that page. Try a different recipe URL.'); return; }
      setPreview(normalizeRecipe(node, url, ogImage(html)));
    } catch {
      setImportError('Could not fetch this page — some sites block automated access from desktop. It usually works on the phone build, or try another URL.');
    } finally { setImporting(false); }
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
        <ul className="text-xs text-gray-600 space-y-0.5 list-disc pl-4">{r.ingredients.map((ing, i) => <li key={i}>{cleanLine(ing)}</li>)}</ul>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Steps</p>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">{r.instructions.map((s, i) => <li key={i}>{cleanLine(s)}</li>)}</ol>
      </div>
      {r.source && <a href={r.source} target="_blank" rel="noreferrer" className="text-xs text-teal-600 underline block">Original source ↗</a>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-5 border border-amber-200">
        <h2 className="text-lg font-semibold text-amber-800 flex items-center gap-2"><ChefHat size={18} /> Recipes</h2>
        <p className="text-xs text-amber-700 mt-1">Three recipe databases + ad-free imports — every filter combines in one search!</p>
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
            <p className="text-[11px] text-gray-400">Strips ads & life stories, keeps ingredients + steps + photo. Wikibooks URLs import directly!</p>
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
            <p className="text-[10px] text-gray-400">Credits: TheMealDB + DummyJSON open recipe data + Wikibooks Cookbook community recipes 💛</p>
          </div>

          {searching && <p className="text-center text-gray-400 text-sm py-8 animate-pulse">Searching three recipe databases…</p>}
          {enriching && <p className="text-center text-gray-400 text-xs animate-pulse">🔬 Checking ingredients against your filters…</p>}
          {!searching && base.length > 0 && (
            <p className="text-xs text-amber-600 text-center">{filtered.length} of {scanned} recipes scanned across all databases match your filters</p>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
              <button disabled={safePage <= 1} onClick={() => setPage(p => p - 1)} className={'flex items-center gap-1 text-xs px-2 py-1 rounded-lg ' + (safePage <= 1 ? 'text-gray-300' : 'text-teal-600 hover:bg-teal-50')}><ChevronLeft size={14} /> Prev</button>
              <p className="text-xs text-gray-500">Page {safePage} of {totalPages} • {filtered.length} matches</p>
              <button disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} className={'flex items-center gap-1 text-xs px-2 py-1 rounded-lg ' + (safePage >= totalPages ? 'text-gray-300' : 'text-teal-600 hover:bg-teal-50')}>Next <ChevronRight size={14} /></button>
            </div>
          )}
          {base.length > 0 && filtered.length === 0 && !enriching && (
            <div className="text-center py-8 space-y-3">
              <p className="text-gray-400 text-sm">Nothing matches this exact combination.</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {diet !== 'all' && <button onClick={() => setDiet('all')} className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700">Show ignoring diet</button>}
                {(selCat !== 'Any' || selArea !== 'Any' || selIng) && <button onClick={() => { setSelCat('Any'); setSelArea('Any'); setSelIng(''); }} className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700">Show ignoring category/region/ingredient</button>}
                {query && <button onClick={() => setQuery('')} className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700">Show ignoring search text</button>}
              </div>
              <p className="text-xs text-gray-400">Or import from your favorite sensitivity-friendly site with the ad-free importer 🧼</p>
            </div>
          )}

          {pageItems.map(m => {
            const ing = ingsOf(m);
            return (
              <div key={m.src + m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  {m.image ? <img src={m.image} alt={m.name} className="w-14 h-14 rounded-xl object-cover" /> : <span className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">{m.src === 'wb' ? '📖' : '🍽️'}</span>}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{dec(m.name)}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{m.area || m.category || 'web'}{m.tags.length ? ' • ' + m.tags.slice(0, 2).join(', ') : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button title="Save to My Box" onClick={() => saveMeal(m)} className={inBox(m) ? 'text-emerald-500' : 'text-gray-300 hover:text-teal-500'}>{inBox(m) ? <Check size={16} /> : <Plus size={16} />}</button>
                    <button onClick={() => toggleOpen(m)} className="text-gray-400">{open === m.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                  </div>
                </div>
                {open === m.id && (ing.length ? <Detail r={{ image: m.image, ingredients: ing, instructions: cache[m.id] ? cache[m.id].instructions : m.instructions, source: sourceOf(m) }} /> : <p className="text-xs text-gray-400 mt-2 animate-pulse">Loading details…</p>)}
              </div>
            );
          })}
        </>
      )}

      {tab === 'box' && box.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Your recipe box is empty — discover recipes on the 🌐 tab and tap + to save them here! 📦</p>}
      {tab === 'box' && box.map(r => (
        <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-800 text-sm">{r.emoji} {dec(r.name)}</p>
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
