import UpdateChecker from './UpdateChecker';
import {
  createBackup,
  downloadBackup,
  parseBackup,
  restoreBackup,
} from '../services/backup';
import { APP_VERSION } from '../services/updater';
import { useState } from 'react';
import { UserProfile, DailyCheckIn, SleepLog, Goal, Hobby, Movement } from '../types';
import { Settings as SettingsIcon, User, Download, Upload, Trash2, AlertTriangle, Lock } from 'lucide-react';

interface SettingsPageProps {
  profile: UserProfile;
  setProfile: (value: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  setCheckIns: (value: DailyCheckIn[]) => void;
  setSleepLogs: (value: SleepLog[]) => void;
  setGoals: (value: Goal[]) => void;
  setHobbies: (value: Hobby[]) => void;
  setMovements: (value: Movement[]) => void;
}

export default function SettingsPage({ profile, setProfile, setCheckIns, setSleepLogs, setGoals, setHobbies, setMovements }: SettingsPageProps) {
  const [name, setName] = useState(profile.name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showRecipes, setShowRecipes] = useState(() => localStorage.getItem('romo-show-recipes') === 'true');

  const toggleRecipes = (val: boolean) => {
    setShowRecipes(val);
    localStorage.setItem('romo-show-recipes', String(val));
    window.location.reload();
  };

  const handleSaveName = () => { if (name.trim()) setProfile({ ...profile, name: name.trim() }); };
  const handleSetPin = () => {
    if (newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match'); return; }
    setProfile({ ...profile, pin: newPin });
    setShowPinSetup(false); setNewPin(''); setConfirmPin(''); setPinError('');
  };
  const handleRemovePin = () => setProfile({ ...profile, pin: undefined });
  const handleExport = async () => {
    try {
      await downloadBackup(createBackup());
      setExportSuccess(true);
      window.setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      if (message.toLowerCase().includes('cancel')) return;

      console.error('ROMO backup failed:', error);
      alert('ROMO could not create the backup file.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = String(event.target?.result ?? '');
        const backup = parseBackup(text);
        const backupDate = new Date(backup.createdAt);
        const readableDate = Number.isNaN(backupDate.getTime())
          ? backup.createdAt
          : backupDate.toLocaleString();

        const confirmed = window.confirm(
          `Restore this ROMO backup?

` +
          `Created: ${readableDate}
` +
          `App version: ${backup.appVersion}
` +
          `Items: ${Object.keys(backup.storage).length}

` +
          `Your current ROMO data will be downloaded as a safety backup first.`,
        );

        if (!confirmed) return;

        await downloadBackup(createBackup(), 'pre-restore-safety');
        restoreBackup(backup);

        alert('ROMO data restored successfully. The app will now reload. 🎉');
        window.location.reload();
      } catch (error) {
        console.error('ROMO restore failed:', error);
        const message =
          error instanceof Error ? error.message : 'Unknown restore error';
        alert(`ROMO could not restore this file.

${message}`);
      }
    };

    reader.onerror = () => {
      alert('ROMO could not read the selected backup file.');
    };

    reader.readAsText(file);
  };
  const handleResetAll = () => {
    const romoKeys: string[] = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (key?.startsWith('romo-')) {
        romoKeys.push(key);
      }
    }

    for (const key of romoKeys) {
      localStorage.removeItem(key);
    }

    setShowResetConfirm(false);

    alert('All ROMO data has been deleted. The app will now restart.');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-gray-500" size={24} />
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile and data ⚙️</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><User size={18} className="text-amber-500" /> Profile</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center text-3xl">🦦</div>
          <div>
            <p className="font-medium text-gray-800">{profile.name}</p>
            <p className="text-sm text-gray-400">ROMO Member</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Update your name..." className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-300" />
          <button onClick={handleSaveName} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition">Save</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800 text-sm">🧑‍🍳 Enable Recipes Tab</p>
          <p className="text-xs text-gray-500">Search the web & build your recipe box.</p>
        </div>
        <button onClick={() => toggleRecipes(!showRecipes)} className={`w-12 h-6 rounded-full relative transition ${showRecipes ? 'bg-teal-500' : 'bg-gray-300'}`}>
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${showRecipes ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Lock size={18} className="text-indigo-500" /> Security</h2>
        {profile.pin ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
              <div>
                <p className="font-medium text-green-800 text-sm">PIN Protection Active</p>
                <p className="text-xs text-green-600">Your data is secured with a PIN</p>
              </div>
              <span className="text-green-500">🔒</span>
            </div>
            <button onClick={handleRemovePin} className="w-full px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition">Remove PIN</button>
          </div>
        ) : (
          <div className="space-y-3">
            {!showPinSetup ? (
              <button onClick={() => setShowPinSetup(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-left">
                <Lock size={18} className="text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Set PIN</p>
                  <p className="text-xs text-gray-400">Protect your data with a PIN code</p>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="Enter PIN (4+ digits)" maxLength={8} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
                <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="Confirm PIN" maxLength={8} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
                {pinError && <p className="text-red-500 text-xs">{pinError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSetPin} className="flex-1 bg-indigo-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-600 transition">Set PIN</button>
                  <button onClick={() => { setShowPinSetup(false); setNewPin(''); setConfirmPin(''); setPinError(''); }} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-2"><Download size={18} className="text-teal-500" /> Data Management</h2>
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-4">
          Backups contain your complete local ROMO data, including profile and PIN settings. Store them privately.
        </p>
        <div className="space-y-3">
          <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-left">
            <Download size={18} className="text-teal-500" />
            <div>
              <p className="font-medium text-gray-800 text-sm">Export Data</p>
              <p className="text-xs text-gray-400">Choose where to save a complete ROMO text backup</p>
            </div>
          </button>
          {exportSuccess && <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg">✅ Data exported successfully!</div>}
          <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-left cursor-pointer">
            <Upload size={18} className="text-blue-500" />
            <div>
              <p className="font-medium text-gray-800 text-sm">Import Data</p>
              <p className="text-xs text-gray-400">Restore all ROMO data from a .txt or legacy .json backup</p>
            </div>
            <input type="file" accept=".txt,.json,application/json,text/plain" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
        <h2 className="font-semibold text-red-600 flex items-center gap-2 mb-4"><AlertTriangle size={18} /> Danger Zone</h2>
        {showResetConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">This will permanently delete your profile, medications, medication history, check-ins, sleep logs, goals, tricks, recipes, activity data, preferences, and other local ROMO data. Export a backup first if you may want to restore it.</p>
            <div className="flex gap-2">
              <button onClick={handleResetAll} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition">Yes, Delete Everything</button>
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowResetConfirm(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition text-left">
            <Trash2 size={18} className="text-red-500" />
            <div>
              <p className="font-medium text-red-700 text-sm">Reset All Data</p>
              <p className="text-xs text-red-400">Delete all logs, goals, and settings</p>
            </div>
          </button>
        )}
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
        <div className="text-center">
          <span className="text-4xl">🦦</span>
          <h3 className="font-bold text-amber-900 mt-2">ROMO v{APP_VERSION}</h3>
          <p className="text-sm text-amber-700 mt-1">Your Wellness Companion</p>
          <p className="text-xs text-amber-500 mt-2">Built with love • Data stored locally on your device</p>
          <p className="text-xs text-amber-400 mt-1">No accounts, no tracking, just you and Romo 💛</p>
        </div>
      </div>

      <UpdateChecker />
    </div>
  );
}
