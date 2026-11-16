import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from './updater';
import { saveTextFile } from './nativeFileSaver';

export const BACKUP_SCHEMA_VERSION = 1;
export const ROMO_STORAGE_PREFIX = 'romo-';

interface RomoBackup {
  romoBackup: true;
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  storage: Record<string, string>;
}

interface LegacyBackup {
  profile?: unknown;
  checkIns?: unknown[];
  sleepLogs?: unknown[];
  goals?: unknown[];
  hobbies?: unknown[];
  movements?: unknown[];
  exportedAt?: string;
}

const LEGACY_KEY_MAP: Record<keyof Omit<LegacyBackup, 'exportedAt'>, string> = {
  profile: 'romo-profile',
  checkIns: 'romo-checkins',
  sleepLogs: 'romo-sleep',
  goals: 'romo-goals',
  hobbies: 'romo-hobbies',
  movements: 'romo-movements',
};

export function collectRomoStorage(): Record<string, string> {
  const storage: Record<string, string> = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key?.startsWith(ROMO_STORAGE_PREFIX)) continue;

    const value = localStorage.getItem(key);

    if (value !== null) {
      storage[key] = value;
    }
  }

  return storage;
}

export function createBackup(): RomoBackup {
  return {
    romoBackup: true,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    storage: collectRomoStorage(),
  };
}

export async function downloadBackup(
  backup: RomoBackup = createBackup(),
  label = 'backup',
): Promise<void> {
  const date = backup.createdAt.slice(0, 10);
  const filename = `romo-${label}-${date}.txt`;
  const content = JSON.stringify(backup, null, 2);

  if (Capacitor.isNativePlatform()) {
    await saveTextFile(filename, content);
    return;
  }

  const blob = new Blob([content], {
    type: 'text/plain;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFullBackup(parsed: Record<string, unknown>): RomoBackup | null {
  if (parsed.romoBackup !== true) return null;
  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported ROMO backup schema: ${String(parsed.schemaVersion)}`,
    );
  }

  if (!isRecord(parsed.storage)) {
    throw new Error('The ROMO backup storage section is missing.');
  }

  const storage: Record<string, string> = {};

  for (const [key, value] of Object.entries(parsed.storage)) {
    if (!key.startsWith(ROMO_STORAGE_PREFIX)) continue;

    if (typeof value !== 'string') {
      throw new Error(`The stored value for ${key} is invalid.`);
    }

    storage[key] = value;
  }

  return {
    romoBackup: true,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion:
      typeof parsed.appVersion === 'string' ? parsed.appVersion : 'unknown',
    createdAt:
      typeof parsed.createdAt === 'string'
        ? parsed.createdAt
        : new Date().toISOString(),
    storage,
  };
}

function parseLegacyBackup(parsed: Record<string, unknown>): RomoBackup {
  const storage: Record<string, string> = {};
  let foundLegacyData = false;

  for (const [legacyName, storageKey] of Object.entries(LEGACY_KEY_MAP)) {
    const value = parsed[legacyName];

    if (value !== undefined) {
      storage[storageKey] = JSON.stringify(value);
      foundLegacyData = true;
    }
  }

  if (!foundLegacyData) {
    throw new Error('This is not a recognized ROMO backup.');
  }

  return {
    romoBackup: true,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: 'legacy',
    createdAt:
      typeof parsed.exportedAt === 'string'
        ? parsed.exportedAt
        : new Date().toISOString(),
    storage,
  };
}

export function parseBackup(text: string): RomoBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON text.');
  }

  if (!isRecord(parsed)) {
    throw new Error('The selected file is not a ROMO backup.');
  }

  return parseFullBackup(parsed) ?? parseLegacyBackup(parsed);
}

export function restoreBackup(backup: RomoBackup): void {
  const isLegacy = backup.appVersion === 'legacy';

  if (!isLegacy) {
    const existingKeys: string[] = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (key?.startsWith(ROMO_STORAGE_PREFIX)) {
        existingKeys.push(key);
      }
    }

    for (const key of existingKeys) {
      if (!(key in backup.storage)) {
        localStorage.removeItem(key);
      }
    }
  }

  for (const [key, value] of Object.entries(backup.storage)) {
    localStorage.setItem(key, value);
  }
}
