import { useState, useMemo, useRef } from 'react';
import { recipes } from '../data/recipes';
import { Recipe, UserProfile } from '../types';
import { ChefHat, Clock, Users, Search, X, Sparkles, Globe, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { createLLMService, searchWebRecipes, testOllamaConnection } from '../services/llm';

interface RecipesPageProps {
  profile: UserProfile;
}

export default function RecipesPage({ profile }: RecipesPageProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('romo-recipe-favorites') || '[]');
    } catch { return []; }
  });
  const [showLLM, setShowLLM] = useState(false);
  const [llmPrompt, setLlmPrompt] = useState('');
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmResult, setLlmResult] = useState<string>('');
  const [llmStatus, setLlmStatus] = useState<string>('');
  const [showWebSearch, setShowWebSearch] = useState(false);
  const [webQuery, setWebQuery] = useState('');
  const [webResults, setWebResults] = useState<any[]>([]);
  const [webLoading, setWebLoading] = useState(false);
  const [ollamaTestResult, setOllamaTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingOllama, setTestingOllama] = useState(false);

  // Memoize LLM service to avoid recreating on every render
  const llmService = useMemo(() => createLLMService(profile), [profile.llmEnabled, profile.llmProvider, profile.ollamaUrl]);

  const handleLLMGenerate = async () => {
    if (!llmService || !llmPrompt.trim()) return;
    
    setLlmLoading(true);
    setLlmResult('');
    setLlmStatus('Initializing AI model... This may take a moment on first use.');
    
    try {
      setLlmStatus('Generating recipe...');
      const result = await llmService.generateRecipe(llmPrompt);
      
      if (!result || result.trim() === '') {
        setLlmResult('⚠️ The AI returned an empty response. Please try again or rephrase your prompt.');
      } else {
        setLlmResult(result);
        setLlmStatus('✅ Recipe generated successfully!');
      }
    } catch (error: any) {
      console.error('LLM generation error:', error);
      
      let errorMessage = '❌ Failed to generate recipe. ';
      
      if (error.message.includes('WebGPU')) {
        errorMessage += 'Your device does not support WebGPU. Try using Ollama instead, or use a newer device/browser.';
      } else if (error.message.includes('Ollama')) {
        errorMessage += error.message;
      } else if (error.message.includes('CORS')) {
        errorMessage += 'CORS error detected. If using Ollama, start it with: OLLAMA_ORIGINS="*" ollama serve';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setLlmResult(errorMessage);
      setLlmStatus('');
    } finally {
      setLlmLoading(false);
    }
  };

  const handleTestOllama = async () => {
    setTestingOllama(true);
    setOllamaTestResult(null);
    
    const result = await testOllamaConnection(profile.ollamaUrl || 'http://localhost:11434');
    setOllamaTestResult(result);
    setTestingOllama(false);
  };

  const handleWebSearch = async () => {
    if (!webQuery.trim()) return;
    setWebLoading(true);
    const results = await searchWebRecipes(webQuery);
    setWebResults(results);
    setWebLoading(false);
  };

  const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'];

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string) => {
    const newFavs = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('romo-recipe-favorites', JSON.stringify(newFavs));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ChefHat className="text-orange-500" size={24} />
          Recipe Library
        </h1>
        <p className="text-gray-500 text-sm mt-1">Discover wholesome recipes for every meal 🍽️</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes or tags..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300 bg-white"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize whitespace-nowrap transition ${
              activeCategory === cat
                ? 'bg-orange-100 text-orange-700 font-medium'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? '🍴 All' : cat === 'breakfast' ? '🌅 Breakfast' : cat === 'lunch' ? '☀️ Lunch' : cat === 'dinner' ? '🌙 Dinner' : cat === 'snack' ? '🍿 Snacks' : '🍰 Dessert'}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl mb-4 block">🔍</span>
          <p className="text-gray-400">No recipes found. Try a different search!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-orange-100 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{recipe.emoji}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                  className="text-lg opacity-60 hover:opacity-100 transition"
                >
                  {favorites.includes(recipe.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition">
                {recipe.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {recipe.prepTime + recipe.cookTime}min
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} /> {recipe.servings}
                </span>
                <span className="capitalize px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                  {recipe.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Recipe Generator */}
      {profile.llmEnabled && llmService && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              AI Recipe Generator
            </h2>
            <button
              onClick={() => setShowLLM(!showLLM)}
              className="text-sm bg-purple-50 text-purple-600 px-3 py-1 rounded-lg hover:bg-purple-100 transition"
            >
              {showLLM ? 'Close' : 'Generate'}
            </button>
          </div>

          {showLLM && (
            <div className="space-y-3">
              {/* Provider Info */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-medium mb-1">
                  {profile.llmProvider === 'web-llm' ? '🌐 WebLLM (Browser-based)' : '🖥️ Ollama (Local Server)'}
                </p>
                {profile.llmProvider === 'web-llm' && (
                  <p>Model downloads on first use (~700MB). Requires WebGPU support (Chrome 113+).</p>
                )}
                {profile.llmProvider === 'ollama' && (
                  <div>
                    <p>URL: {profile.ollamaUrl || 'http://localhost:11434'}</p>
                    <button
                      onClick={handleTestOllama}
                      disabled={testingOllama}
                      className="mt-2 text-purple-600 hover:text-purple-700 underline disabled:opacity-50"
                    >
                      {testingOllama ? 'Testing...' : 'Test Connection'}
                    </button>
                    {ollamaTestResult && (
                      <div className={`mt-2 flex items-start gap-2 ${ollamaTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {ollamaTestResult.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        <span>{ollamaTestResult.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <textarea
                value={llmPrompt}
                onChange={(e) => setLlmPrompt(e.target.value)}
                placeholder="Describe what you want... e.g., 'A healthy vegetarian dinner with spinach and quinoa'"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-300 resize-none"
                rows={3}
              />
              
              <button
                onClick={handleLLMGenerate}
                disabled={llmLoading || !llmPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2.5 rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {llmLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Recipe
                  </>
                )}
              </button>

              {/* Status Message */}
              {llmStatus && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    {llmLoading && <Loader2 size={14} className="animate-spin" />}
                    {llmStatus}
                  </p>
                </div>
              )}

              {/* Result */}
              {llmResult && (
                <div className={`rounded-lg p-4 mt-3 ${
                  llmResult.startsWith('❌') || llmResult.startsWith('⚠️')
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-purple-50 border border-purple-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{llmResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Web Recipe Search */}
      {profile.webSearchEnabled && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Globe size={18} className="text-blue-500" />
              Web Recipe Search
            </h2>
            <button
              onClick={() => setShowWebSearch(!showWebSearch)}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
            >
              {showWebSearch ? 'Close' : 'Search'}
            </button>
          </div>

          {showWebSearch && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webQuery}
                  onChange={(e) => setWebQuery(e.target.value)}
                  placeholder="Search for recipes online..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-300"
                  onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                />
                <button
                  onClick={handleWebSearch}
                  disabled={webLoading || !webQuery.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {webLoading ? '...' : 'Search'}
                </button>
              </div>

              {webResults.length > 0 && (
                <div className="space-y-2 mt-3">
                  {webResults.map((result, i) => (
                    <a
                      key={i}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      <p className="text-sm font-medium text-blue-900">{result.title}</p>
                      <p className="text-xs text-blue-600 mt-1 line-clamp-2">{result.snippet}</p>
                    </a>
                  ))}
                </div>
              )}

              {webResults.length === 0 && !webLoading && webQuery && (
                <p className="text-sm text-gray-400 text-center py-4">No results found. Try a different search.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedRecipe.emoji}</span>
                <h2 className="text-lg font-bold text-gray-800">{selectedRecipe.name}</h2>
              </div>
              <button onClick={() => setSelectedRecipe(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <p className="text-gray-600">{selectedRecipe.description}</p>

              {/* Meta */}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} /> Prep: {selectedRecipe.prepTime}min
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} /> Cook: {selectedRecipe.cookTime}min
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users size={14} /> Serves: {selectedRecipe.servings}
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                {selectedRecipe.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">🥘 Ingredients</h3>
                <ul className="space-y-1.5">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-orange-300 rounded-full" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">📝 Instructions</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((inst, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{inst}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
