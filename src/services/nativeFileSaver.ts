import { Capacitor, registerPlugin } from '@capacitor/core';

interface SaveTextFileOptions {
  filename: string;
  content: string;
  mimeType?: string;
}

interface SaveTextFileResult {
  uri: string;
  filename?: string;
}

interface RomoFileSaverPlugin {
  saveTextFile(
    options: SaveTextFileOptions,
  ): Promise<SaveTextFileResult>;
}

const RomoFileSaver = registerPlugin<RomoFileSaverPlugin>(
  'RomoFileSaver',
);

export async function saveTextFile(
  filename: string,
  content: string,
): Promise<SaveTextFileResult> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Native file picker is unavailable.');
  }

  return RomoFileSaver.saveTextFile({
    filename,
    content,
    mimeType: 'text/plain',
  });
}
