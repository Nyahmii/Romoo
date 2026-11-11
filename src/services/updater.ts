import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

export const APP_VERSION = '1.0';
const REPO = 'Nyahmii/Romoo';
export interface UpdateInfo { url: string; version: string; }

const newer = (a: string, b: string) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return true; if ((pa[i] || 0) < (pb[i] || 0)) return false; }
  return false;
};

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const r = await fetch('https://api.github.com/repos/' + REPO + '/releases/latest');
  if (!r.ok) return null;
  const j = await r.json();
  const tag = String(j.tag_name || '').replace(/^v/, '');
  if (!tag || !newer(tag, APP_VERSION)) return null;
  const asset = (j.assets || []).find((a: any) => String(a.name).endsWith('.apk'));
  return asset ? { url: asset.browser_download_url, version: tag } : null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onloadend = () => resolve(String(fr.result).split(',')[1]);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

export async function downloadAndInstall(url: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('download failed');
  const blob = await res.blob();
  const data = await blobToBase64(blob);
  const { uri } = await Filesystem.writeFile({ path: 'romo-update.apk', data, directory: Directory.Cache, recursive: true });
  await FileOpener.open({ filePath: uri, contentType: 'application/vnd.android.package-archive' });
}
