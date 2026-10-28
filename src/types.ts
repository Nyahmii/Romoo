export interface DailyCheckIn {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'low' | 'bad';
  energy: number; // 1-5
  gratitude: string[];
  notes: string;
  createdAt: string;
}

export interface SleepLog {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number; // 1-5
  notes: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'health' | 'learning' | 'creative' | 'personal' | 'career';
  targetDate?: string;
  completed: boolean;
  tasks: Task[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface Hobby {
  id: string;
  name: string;
  category: string;
  sessions: HobbySession[];
  totalMinutes: number;
  createdAt: string;
}

export interface HobbySession {
  id: string;
  date: string;
  duration: number; // minutes
  notes: string;
}

export interface Movement {
  id: string;
  date: string;
  type: 'stretch' | 'walk' | 'yoga' | 'dance' | 'other';
  duration: number; // minutes
  intensity: 'gentle' | 'moderate' | 'intense';
  notes: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  tags: string[];
  emoji: string;
}

export interface UserProfile {
  name: string;
  hasCompletedOnboarding: boolean;
  theme: 'light' | 'dark';
}

export type Page = 'dashboard' | 'goals' | 'recipes' | 'history' | 'settings';
