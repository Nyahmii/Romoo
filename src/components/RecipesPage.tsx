import { useState } from 'react';
import { recipes } from '../data/recipes';
import { Recipe } from '../types';
import { ChefHat, Clock, Users, Search, X } from 'lucide-react';

export default function RecipesPage() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('romo-recipe-favorites') || '[]');
    } catch { return []; }
  });

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
