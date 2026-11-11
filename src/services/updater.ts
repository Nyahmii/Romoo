import { Browser } from '@capacitor/browser';

export const APP_VERSION = '1.10'; // Make sure this matches your current version
const REPO = 'Nyahmii/Romoo';
export interface UpdateInfo { url: string; version: string; }

const newer = (a: string, b: string) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return true; if ((pa[i] || 0) < (pb[i] || 0)) return false; }
  return false;
};

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const r = await fetch('https://api.github.com/repos/' + REPO + '/releases/latest');
  if (!r.ok) throw new Error('GitHub API error: ' + r.status);
  const j = await r.json();
  const tag = String(j.tag_name || '').replace(/^v/, '');
  if (!tag || !newer(tag, APP_VERSION)) return null;
  const asset = (j.assets || []).find((a: any) => String(a.name).endsWith('.apk'));
  return asset ? { url: asset.browser_download_url, version: tag } : null;
}

export async function downloadAndInstall(url: string): Promise<void> {
  // Opens the URL in the native browser, letting Android's Download Manager handle it safely
  await Browser.open({ url });
}
