import type { VaultStatus } from '../../src/types.ts';

function hasEnv(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0 && !value.startsWith('MY_'));
}

export function readVaultStatus(): VaultStatus {
  return {
    gemini: hasEnv('GEMINI_API_KEY'),
    youtube: hasEnv('YOUTUBE_API_KEY'),
    tiktok: hasEnv('TIKTOK_CLIENT_KEY') && hasEnv('TIKTOK_CLIENT_SECRET'),
    meta: hasEnv('META_ACCESS_TOKEN'),
    x: hasEnv('X_BEARER_TOKEN'),
    openai: hasEnv('OPENAI_API_KEY'),
  };
}

export function youtubeApiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key || key.startsWith('MY_')) {
    return null;
  }
  return key;
}
