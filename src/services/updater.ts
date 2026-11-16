import { Browser } from '@capacitor/browser';

export const APP_VERSION = '1.10.3';

const REPO = 'Nyahmii/Romoo';
const API_ROOT = ['https:', '', 'api.github.com'].join('/');
const RELEASE_API = `${API_ROOT}/repos/${REPO}/releases/latest`;

export interface UpdateInfo {
  url: string;
  version: string;
}

interface GitHubReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

interface GitHubRelease {
  tag_name?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: GitHubReleaseAsset[];
}

function normalizeVersion(version: string): number[] {
  const cleaned = version
    .trim()
    .replace(/^v/i, '')
    .split('-')[0];

  if (!/^\d+(?:\.\d+)*$/.test(cleaned)) {
    return [];
  }

  return cleaned
    .split('.')
    .map((part) => Number.parseInt(part, 10));
}

function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = normalizeVersion(latest);
  const currentParts = normalizeVersion(current);
  const length = Math.max(latestParts.length, currentParts.length);

  if (!latestParts.length || !currentParts.length) {
    return false;
  }

  for (let index = 0; index < length; index += 1) {
    const latestPart = latestParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const response = await fetch(RELEASE_API, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const release = (await response.json()) as GitHubRelease;

  if (release.draft || release.prerelease) {
    return null;
  }

  const latestVersion = String(release.tag_name ?? '')
    .trim()
    .replace(/^v/i, '');

  if (!latestVersion || !isNewerVersion(latestVersion, APP_VERSION)) {
    return null;
  }

  const apkAsset = (release.assets ?? []).find((asset) =>
    String(asset.name ?? '').toLowerCase().endsWith('.apk'),
  );

  if (!apkAsset?.browser_download_url) {
    return null;
  }

  return {
    url: apkAsset.browser_download_url,
    version: latestVersion,
  };
}

export async function downloadAndInstall(url: string): Promise<void> {
  await Browser.open({ url });
}
