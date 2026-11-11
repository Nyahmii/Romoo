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
import MedicationsPage from './components/MedicationsPage';
import TrickLibraryPage from './components/TrickLibraryPage';
import StatsPage from './components/StatsPage';
import Onboarding from './components/Onboarding';
import LockScreen from './components/LockScreen';

type Freq = 'daily' | 'weekly' | 'biweekly' | 'monthly';
interface Med { id: string; name: string; emoji: string; dose: string; pillsLeft: number | null; refillAt: number; start: string; end: string; freq: Freq; times: string[]; weekdays: number[]; monthDay: number; remind: boolean; note: string; }
interface Intake { medId: string; date: string; time: string; status: 'taken' | 'skipped'; note: string; }

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLocked, setIsLocked] = useState(false);
  const [profile, setProfile] = useLocalStorage<UserProfile>('romo-profile', {
    name: '',
    hasCompletedOnboarding: false,
    theme: 'light',
  });
  const [checkIns, setCheckIns] = useLocalStorage<DailyCheckIn[]>('romo-checkins', []);
  const [sleepLogs, setSleepLogs] = useLocalStorage<SleepLog[]>('romo-sleep', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('romo-goals', []);
  const [hobbies, setHobbies] = useLocalStorage<Hobby[]>('romo-hobbies', []);
  const [movements, setMovements] = useLocalStorage<Movement[]>('romo-movements', []);
  
  const [meds, setMeds] = useLocalStorage<Med[]>('romo-meds-v2', []);
  const [intakes, setIntakes] = useLocalStorage<Intake[]>('romo-intakes-v2', []);

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
            meds={meds}
            setMeds={setMeds}
            intakes={intakes}
            setIntakes={setIntakes}
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
      case 'meds':
        return <MedicationsPage />;
      case 'tricks':
        return <TrickLibraryPage />;
      case 'stats':
        return <StatsPage />;
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
