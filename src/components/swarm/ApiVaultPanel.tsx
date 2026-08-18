import React, { useEffect, useState } from 'react';
import type { VaultStatus } from '../../types';
import { fetchVaultStatus } from '../../lib/swarmClient';
import {
  clearClientVault,
  emptyVault,
  loadClientVault,
  maskSecret,
  saveClientVault,
  vaultHasCiphertext,
  type ClientVaultMap,
} from '../../lib/apiVault';

const FIELDS: Array<{ key: keyof ClientVaultMap; label: string }> = [
  { key: 'gemini', label: 'Gemini' },
  { key: 'youtube', label: 'YouTube Data API v3' },
  { key: 'tiktokClientKey', label: 'TikTok client key' },
  { key: 'tiktokClientSecret', label: 'TikTok client secret' },
  { key: 'meta', label: 'Meta Graph token' },
  { key: 'x', label: 'X bearer' },
  { key: 'openai', label: 'OpenAI' },
];

export default function ApiVaultPanel() {
  const [serverVault, setServerVault] = useState<VaultStatus | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [vault, setVault] = useState<ClientVaultMap>(emptyVault());
  const [message, setMessage] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    fetchVaultStatus()
      .then(setServerVault)
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Vault-status kunne ikke hentes');
      });
  }, []);

  const handleUnlock = async () => {
    try {
      const loaded = await loadClientVault(passphrase);
      setVault(loaded);
      setUnlocked(true);
      setMessage(vaultHasCiphertext() ? 'Browser-vault låst op.' : 'Ny browser-vault klar.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kunne ikke låse op');
    }
  };

  const handleSave = async () => {
    try {
      await saveClientVault(passphrase, vault);
      setMessage('Krypteret vault gemt i localStorage. Nøgler sendes ikke til serveren.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gem fejlede');
    }
  };

  const handleClear = () => {
    clearClientVault();
    setVault(emptyVault());
    setUnlocked(false);
    setMessage('Browser-vault slettet.');
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">API Vault Officer</h2>
      <p className="text-[10px] text-zinc-400 mt-1">
        Server-nøgler læses kun som on/off. Browser-vault er AES-GCM og forlader aldrig enheden.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px]">
        {serverVault &&
          (Object.entries(serverVault) as Array<[keyof VaultStatus, boolean]>).map(([key, on]) => (
            <div key={key} className="flex justify-between rounded-md bg-zinc-900 px-2 py-1 border border-zinc-800">
              <span className="uppercase tracking-widest text-zinc-400">{key}</span>
              <span className={on ? 'text-lime-300' : 'text-zinc-500'}>{on ? 'server on' : 'server off'}</span>
            </div>
          ))}
      </div>
      <label className="block mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">
        Adgangskode (min. 8)
        <input
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={handleUnlock} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-100 cursor-pointer">
          Lås op
        </button>
        <button type="button" onClick={handleSave} className="rounded-lg bg-amber-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-950 cursor-pointer">
          Gem krypteret
        </button>
        <button type="button" onClick={handleClear} className="rounded-lg border border-red-400/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-300 cursor-pointer">
          Slet vault
        </button>
      </div>
      {unlocked && (
        <div className="mt-3 space-y-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="block text-[9px] font-black uppercase tracking-widest text-zinc-400">
              {field.label}
              <input
                type="password"
                value={vault[field.key]}
                onChange={(event) => setVault((prev) => ({ ...prev, [field.key]: event.target.value }))}
                placeholder={maskSecret(vault[field.key])}
                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
              />
            </label>
          ))}
        </div>
      )}
      {message && <p className="mt-2 text-[11px] text-amber-100">{message}</p>}
    </section>
  );
}
