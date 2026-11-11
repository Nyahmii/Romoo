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
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('romo-update-check') === today) return;
    localStorage.setItem('romo-update-check', today);
    checkForUpdate().then(u => setUpdate(u)).catch(() => {});
  }, []);
  if (!update || hidden) return null;
  return (
    <div className="max-w-4xl mx-auto px-4 pt-3">
      <div className="bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3">
        <span className="text-xl">🦦</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">Update available: v{update.version}</p>
          <p className="text-[11px] text-emerald-700">{status || 'Installs in place — your data stays safe.'}</p>
        </div>
        {status ? <span className="text-xs text-emerald-700 animate-pulse">…</span> : (
          <div className="flex gap-1">
            <button onClick={async () => { setStatus('Downloading…'); try { await downloadAndInstall(update.url); setStatus('Opening installer…'); } catch { setStatus('Download failed — try again.'); } }} className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={12} /> Update</button>
            <button onClick={() => setHidden(true)} className="text-emerald-600"><X size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
