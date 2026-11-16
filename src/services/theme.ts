export type RomoTheme =
  | 'classic'
  | 'sakura'
  | 'ocean'
  | 'moonlight';

export const ROMO_THEME_KEY = 'romo-theme';

export interface ThemeOption {
  id: RomoTheme;
  name: string;
  emoji: string;
  description: string;
  colors: string[];
}

export const ROMO_THEMES: ThemeOption[] = [
  {
    id: 'classic',
    name: 'Romo Classic',
    emoji: '🦦',
    description: 'Warm amber, cream, and teal',
    colors: ['#f59e0b', '#fffbeb', '#14b8a6'],
  },
  {
    id: 'sakura',
    name: 'Sakura',
    emoji: '🌸',
    description: 'Soft rose, pink, and lavender',
    colors: ['#fb7185', '#fff1f2', '#a78bfa'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    description: 'Calm cyan, blue, and teal',
    colors: ['#0891b2', '#ecfeff', '#14b8a6'],
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    emoji: '🌙',
    description: 'Deep navy with lavender highlights',
    colors: ['#818cf8', '#111827', '#a78bfa'],
  },
];

export function getTheme(): RomoTheme {
  const stored = localStorage.getItem(ROMO_THEME_KEY);

  if (
    stored === 'classic' ||
    stored === 'sakura' ||
    stored === 'ocean' ||
    stored === 'moonlight'
  ) {
    return stored;
  }

  return 'classic';
}

export function applyTheme(theme: RomoTheme): void {
  document.documentElement.dataset.romoTheme = theme;
}

export function saveTheme(theme: RomoTheme): void {
  localStorage.setItem(ROMO_THEME_KEY, theme);
  applyTheme(theme);
}
