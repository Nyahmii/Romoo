import { ReactNode, useEffect, useState } from 'react';
import { Page } from '../types';
import { Home, Target, ChefHat, Clock, Settings, Pill, ListTree, BarChart3 } from 'lucide-react';
import UpdateBanner from './UpdateBanner';

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  profileName: string;
}

export default function Layout({ children, currentPage, setCurrentPage, profileName }: LayoutProps) {
  const [showRecipes] = useState(() => localStorage.getItem('romo-show-recipes') === 'true');

  const navItems: { page: Page; label: string; icon: typeof Home }[] = [
    { page: 'dashboard', label: 'Home', icon: Home },
    { page: 'meds', label: 'Meds', icon: Pill },
    { page: 'goals', label: 'Goals', icon: Target },
  ];

  if (showRecipes) {
    navItems.push({ page: 'recipes', label: 'Recipes', icon: ChefHat });
  }

  navItems.push(
    { page: 'history', label: 'History', icon: Clock },
    { page: 'stats', label: 'Stats', icon: BarChart3 },
    { page: 'tricks', label: 'Tricks', icon: ListTree },
    { page: 'settings', label: 'Settings', icon: Settings },
  );

  return (
    <div
      className="romo-app min-h-screen"
      style={{
        paddingTop: 'var(--romo-safe-top)',
        paddingLeft: 'var(--romo-safe-left)',
        paddingRight: 'var(--romo-safe-right)',
      }}
    >
      <div
        aria-hidden="true"
        className="romo-status-scrim fixed top-0 left-0 right-0 z-[70]"
        style={{ height: 'var(--romo-safe-top)' }}
      />
      <UpdateBanner />
      <header className="romo-header border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦦</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-teal-600 bg-clip-text text-transparent">ROMO</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Hi, {profileName}!</span>
            <span className="text-lg">👋</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-32">
        {children}
      </main>

      <nav style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} className="romo-nav fixed bottom-0 left-0 right-0 border-t border-amber-100 z-50">
        <div className="max-w-4xl mx-auto px-2 py-2 flex justify-around overflow-x-auto">
          {navItems.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all shrink-0 ${
                currentPage === page ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} strokeWidth={currentPage === page ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
