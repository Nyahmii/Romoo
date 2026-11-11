import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { checkForUpdate, downloadAndInstall, APP_VERSION } from '../services/updater';

export default function UpdateChecker() {
  const [status, setStatus] = useState('Current version: v' + APP_VERSION);
  const run = async () => {
    setStatus('Checking…');
    try {
      const u = await checkForUpdate();
      if (!u) { setStatus('You are on the latest version (v' + APP_VERSION + ') ✓'); return; }
      setStatus('Downloading v' + u.version + '…');
      await downloadAndInstall(u.url);
      setStatus('Opening installer…');
    } catch {
      setStatus('Check failed — are you online?');
    }
  };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
      <p className="font-semibold text-gray-800 text-sm">📲 App updates</p>
      <p className="text-xs text-gray-500">{status}</p>
      <button onClick={run} className="w-full bg-teal-500 text-white py-2 rounded-xl text-sm flex items-center justify-center gap-2"><RefreshCw size={14} /> Check for updates</button>
    </div>
  );
}
