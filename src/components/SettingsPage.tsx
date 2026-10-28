import { useState } from 'react';
import { UserProfile, DailyCheckIn, SleepLog, Goal, Hobby, Movement } from '../types';
import { Settings as SettingsIcon, User, Download, Upload, Trash2, AlertTriangle, Lock, Sparkles } from 'lucide-react';

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
  const [showLLMSettings, setShowLLMSettings] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(profile.ollamaUrl || 'http://localhost:11434');

  const handleSaveName = () => {
    if (name.trim()) {
      setProfile({ ...profile, name: name.trim() });
    }
  };

  const handleSetPin = () => {
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    setProfile({ ...profile, pin: newPin });
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleRemovePin = () => {
    setProfile({ ...profile, pin: undefined });
  };

  const handleToggleLLM = (enabled: boolean) => {
    setProfile({ ...profile, llmEnabled: enabled });
  };

  const handleSetLLMProvider = (provider: 'web-llm' | 'ollama' | 'none') => {
    setProfile({ ...profile, llmProvider: provider });
  };

  const handleSaveOllamaUrl = () => {
    setProfile({ ...profile, ollamaUrl });
  };

  const handleToggleWebSearch = (enabled: boolean) => {
    setProfile({ ...profile, webSearchEnabled: enabled });
  };

  const handleExport = () => {
    const data = {
      profile,
      checkIns: JSON.parse(localStorage.getItem('romo-checkins') || '[]'),
      sleepLogs: JSON.parse(localStorage.getItem('romo-sleep') || '[]'),
      goals: JSON.parse(localStorage.getItem('romo-goals') || '[]'),
      hobbies: JSON.parse(localStorage.getItem('romo-hobbies') || '[]'),
      movements: JSON.parse(localStorage.getItem('romo-movements') || '[]'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `romo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.checkIns) setCheckIns(data.checkIns);
        if (data.sleepLogs) setSleepLogs(data.sleepLogs);
        if (data.goals) setGoals(data.goals);
        if (data.hobbies) setHobbies(data.hobbies);
        if (data.movements) setMovements(data.movements);
        if (data.profile) setProfile(data.profile);
        alert('Data imported successfully! 🎉');
      } catch {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    setCheckIns([]);
    setSleepLogs([]);
    setGoals([]);
    setHobbies([]);
    setMovements([]);
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-gray-500" size={24} />
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile and data ⚙️</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <User size={18} className="text-amber-500" />
          Profile
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center text-3xl">
            🦦
          </div>
          <div>
            <p className="font-medium text-gray-800">{profile.name}</p>
            <p className="text-sm text-gray-400">ROMO Member</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Update your name..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-amber-300"
          />
          <button
            onClick={handleSaveName}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition"
          >
            Save
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Lock size={18} className="text-indigo-500" />
          Security
        </h2>
        
        {profile.pin ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
              <div>
                <p className="font-medium text-green-800 text-sm">PIN Protection Active</p>
                <p className="text-xs text-green-600">Your data is secured with a PIN</p>
              </div>
              <span className="text-green-500">🔒</span>
            </div>
            <button
              onClick={handleRemovePin}
              className="w-full px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition"
            >
              Remove PIN
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!showPinSetup ? (
              <button
                onClick={() => setShowPinSetup(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-left"
              >
                <Lock size={18} className="text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Set PIN</p>
                  <p className="text-xs text-gray-400">Protect your data with a PIN code</p>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter PIN (4+ digits)"
                  maxLength={8}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300"
                />
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm PIN"
                  maxLength={8}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300"
                />
                {pinError && <p className="text-red-500 text-xs">{pinError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSetPin}
                    className="flex-1 bg-indigo-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-600 transition"
                  >
                    Set PIN
                  </button>
                  <button
                    onClick={() => { setShowPinSetup(false); setNewPin(''); setConfirmPin(''); setPinError(''); }}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI & LLM Settings */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-purple-500" />
          AI & LLM Features
        </h2>
        
        <div className="space-y-4">
          {/* LLM Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">Enable Local LLM</p>
              <p className="text-xs text-gray-400">AI-powered recipe generation (runs locally)</p>
            </div>
            <button
              onClick={() => handleToggleLLM(!profile.llmEnabled)}
              className={`w-12 h-6 rounded-full transition ${profile.llmEnabled ? 'bg-purple-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition ${profile.llmEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {profile.llmEnabled && (
            <div className="space-y-3 pl-2 border-l-2 border-purple-100 ml-2">
              {/* Provider Selection */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">LLM Provider</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={profile.llmProvider === 'web-llm'}
                      onChange={() => handleSetLLMProvider('web-llm')}
                      className="text-purple-500"
                    />
                    <div>
                      <p className="text-sm text-gray-800">WebLLM (Browser-based)</p>
                      <p className="text-xs text-gray-400">Runs in browser using WebGPU (requires compatible device)</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={profile.llmProvider === 'ollama'}
                      onChange={() => handleSetLLMProvider('ollama')}
                      className="text-purple-500"
                    />
                    <div>
                      <p className="text-sm text-gray-800">Ollama (Local Server)</p>
                      <p className="text-xs text-gray-400">Connect to local Ollama instance</p>
                    </div>
                  </label>
                </div>
              </div>

              {profile.llmProvider === 'ollama' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Ollama URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-purple-300"
                    />
                    <button
                      onClick={handleSaveOllamaUrl}
                      className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Web Search Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="font-medium text-gray-800 text-sm">Web Recipe Search</p>
              <p className="text-xs text-gray-400">Search the web for recipes (requires internet)</p>
            </div>
            <button
              onClick={() => handleToggleWebSearch(!profile.webSearchEnabled)}
              className={`w-12 h-6 rounded-full transition ${profile.webSearchEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition ${profile.webSearchEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Download size={18} className="text-teal-500" />
          Data Management
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-left"
          >
            <Download size={18} className="text-teal-500" />
            <div>
              <p className="font-medium text-gray-800 text-sm">Export Data</p>
              <p className="text-xs text-gray-400">Download all your data as a JSON file</p>
            </div>
          </button>

          {exportSuccess && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg">
              ✅ Data exported successfully!
            </div>
          )}

          <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-left cursor-pointer">
            <Upload size={18} className="text-blue-500" />
            <div>
              <p className="font-medium text-gray-800 text-sm">Import Data</p>
              <p className="text-xs text-gray-400">Restore from a previous backup</p>
            </div>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
        <h2 className="font-semibold text-red-600 flex items-center gap-2 mb-4">
          <AlertTriangle size={18} />
          Danger Zone
        </h2>
        
        {showResetConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete ALL data? This cannot be undone!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleResetAll}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition"
              >
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition text-left"
          >
            <Trash2 size={18} className="text-red-500" />
            <div>
              <p className="font-medium text-red-700 text-sm">Reset All Data</p>
              <p className="text-xs text-red-400">Delete all logs, goals, and settings</p>
            </div>
          </button>
        )}
      </div>

      {/* About */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
        <div className="text-center">
          <span className="text-4xl">🦦</span>
          <h3 className="font-bold text-amber-900 mt-2">ROMO v2.0</h3>
          <p className="text-sm text-amber-700 mt-1">Your Wellness Companion</p>
          <p className="text-xs text-amber-500 mt-2">
            Built with love • Data stored locally on your device
          </p>
          <p className="text-xs text-amber-400 mt-1">
            No accounts, no tracking, just you and Romo 💛
          </p>
        </div>
      </div>
    </div>
  );
}
