import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { checkForUpdate, downloadAndInstall, UpdateInfo } from '../services/updater';

export default function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [status, setStatus] = useState('');
  const [hidden, setHidden] = useState(false);
  
  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    checkForUpdate()
      .then(u => setUpdate(u))
      .catch(err => console.warn('Update check skipped:', err.message));
  }, []);

  if (!update || hidden) return null;
  
  const handleUpdate = async () => {
    setStatus('Opening browser…');
    try {
      await downloadAndInstall(update.url);
      setStatus('Check your downloads to install!');
    } catch {
      setStatus('Failed to open browser.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-3">
      <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3">
        <span className="text-xl">🦦</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">Update available: v{update.version}</p>
          <p className="text-[11px] text-emerald-700">{status || 'Tap Update to download via browser.'}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={handleUpdate} className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={12} /> Update</button>
          <button onClick={() => setHidden(true)} className="text-emerald-600"><X size={14} /></button>
        </div>
      </div>
    </div>
  );
}
