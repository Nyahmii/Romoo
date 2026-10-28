import { ReactNode } from 'react';
import { Page } from '../types';
import { Home, Target, ChefHat, Clock, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  profileName: string;
}

const navItems: { page: Page; label: string; icon: typeof Home }[] = [
  { page: 'dashboard', label: 'Home', icon: Home },
  { page: 'goals', label: 'Goals', icon: Target },
  { page: 'recipes', label: 'Recipes', icon: ChefHat },
  { page: 'history', label: 'History', icon: Clock },
  { page: 'settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children, currentPage, setCurrentPage, profileName }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦦</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-teal-600 bg-clip-text text-transparent">
              ROMO
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Hi, {profileName}!</span>
            <span className="text-lg">👋</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-amber-100 z-50">
        <div className="max-w-4xl mx-auto px-2 py-2 flex justify-around">
          {navItems.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                currentPage === page
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-gray-400 hover:text-gray-600'
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
