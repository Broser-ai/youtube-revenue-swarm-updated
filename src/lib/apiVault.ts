const VAULT_STORAGE_KEY = 'cirkel_swarm_vault_v1';

export type ClientVaultKeyName =
  | 'youtube'
  | 'tiktokClientKey'
  | 'tiktokClientSecret'
  | 'meta'
  | 'x'
  | 'openai'
  | 'gemini';

export type ClientVaultMap = Record<ClientVaultKeyName, string>;

const EMPTY_VAULT: ClientVaultMap = {
  youtube: '',
  tiktokClientKey: '',
  tiktokClientSecret: '',
  meta: '',
  x: '',
  openai: '',
  gemini: '',
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function emptyVault(): ClientVaultMap {
  return { ...EMPTY_VAULT };
}

export function vaultHasCiphertext(): boolean {
  return Boolean(localStorage.getItem(VAULT_STORAGE_KEY));
}

export async function saveClientVault(passphrase: string, vault: ClientVaultMap): Promise<void> {
  if (!passphrase || passphrase.length < 8) {
    throw new Error('Vault-adgangskode skal være mindst 8 tegn.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(vault));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  localStorage.setItem(
    VAULT_STORAGE_KEY,
    JSON.stringify({
      v: 1,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(cipher)),
    }),
  );
}

export async function loadClientVault(passphrase: string): Promise<ClientVaultMap> {
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) {
    return emptyVault();
  }
  const parsed = JSON.parse(raw) as { salt?: string; iv?: string; data?: string };
  if (!parsed.salt || !parsed.iv || !parsed.data) {
    throw new Error('Vault-data er korrupt.');
  }
  const key = await deriveKey(passphrase, base64ToBytes(parsed.salt));
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(parsed.iv) },
      key,
      base64ToBytes(parsed.data),
    );
    const decoded = JSON.parse(new TextDecoder().decode(plain)) as Partial<ClientVaultMap>;
    return { ...EMPTY_VAULT, ...decoded };
  } catch {
    throw new Error('Forkert adgangskode eller ødelagt vault.');
  }
}

export function maskSecret(value: string): string {
  if (!value) {
    return 'ikke sat';
  }
  if (value.length <= 8) {
    return '********';
  }
  return `${value.slice(0, 3)}••••${value.slice(-2)}`;
}

export function clearClientVault(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
}
