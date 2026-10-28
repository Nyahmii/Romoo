import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Page, UserProfile, DailyCheckIn, SleepLog, Goal, Hobby, Movement } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import GoalsPage from './components/GoalsPage';
import RecipesPage from './components/RecipesPage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import StatisticsPage from './components/StatisticsPage';
import Onboarding from './components/Onboarding';
import LockScreen from './components/LockScreen';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLocked, setIsLocked] = useState(false);
  const [profile, setProfile] = useLocalStorage<UserProfile>('romo-profile', {
    name: '',
    hasCompletedOnboarding: false,
    theme: 'light',
    llmEnabled: false,
    llmProvider: 'none',
    webSearchEnabled: false,
  });
  const [checkIns, setCheckIns] = useLocalStorage<DailyCheckIn[]>('romo-checkins', []);
  const [sleepLogs, setSleepLogs] = useLocalStorage<SleepLog[]>('romo-sleep', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('romo-goals', []);
  const [hobbies, setHobbies] = useLocalStorage<Hobby[]>('romo-hobbies', []);
  const [movements, setMovements] = useLocalStorage<Movement[]>('romo-movements', []);

  // Check if PIN is set and lock the app
  useEffect(() => {
    if (profile.pin && profile.hasCompletedOnboarding) {
      setIsLocked(true);
    }
  }, [profile.pin, profile.hasCompletedOnboarding]);

  const handleUnlock = () => {
    setIsLocked(false);
  };

  if (!profile.hasCompletedOnboarding) {
    return <Onboarding onComplete={(name) => setProfile({ ...profile, name, hasCompletedOnboarding: true })} />;
  }

  if (isLocked && profile.pin) {
    return <LockScreen pin={profile.pin} onUnlock={handleUnlock} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            checkIns={checkIns}
            setCheckIns={setCheckIns}
            sleepLogs={sleepLogs}
            setSleepLogs={setSleepLogs}
            movements={movements}
            setMovements={setMovements}
            profileName={profile.name}
          />
        );
      case 'goals':
        return <GoalsPage goals={goals} setGoals={setGoals} />;
      case 'recipes':
        return <RecipesPage profile={profile} />;
      case 'history':
        return (
          <HistoryPage
            checkIns={checkIns}
            sleepLogs={sleepLogs}
            movements={movements}
            goals={goals}
            hobbies={hobbies}
          />
        );
      case 'statistics':
        return (
          <StatisticsPage
            checkIns={checkIns}
            sleepLogs={sleepLogs}
            movements={movements}
            goals={goals}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            profile={profile}
            setProfile={setProfile}
            setCheckIns={setCheckIns}
            setSleepLogs={setSleepLogs}
            setGoals={setGoals}
            setHobbies={setHobbies}
            setMovements={setMovements}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} profileName={profile.name}>
      {renderPage()}
    </Layout>
  );
}
