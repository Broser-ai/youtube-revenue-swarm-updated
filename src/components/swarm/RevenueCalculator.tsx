import React, { useState } from 'react';
import type { MonetizeResult } from '../../types';
import { formatUsd, PARTNER_LABELS } from '../../lib/swarmLabels';
import { monetizeForecast } from '../../lib/swarmClient';

interface RevenueCalculatorProps {
  niche: string;
  defaultViews: number;
}

export default function RevenueCalculator({ niche, defaultViews }: RevenueCalculatorProps) {
  const [views, setViews] = useState(defaultViews);
  const [ctrPercent, setCtrPercent] = useState(4.8);
  const [epc, setEpc] = useState(0.72);
  const [result, setResult] = useState<MonetizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCalculate = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await monetizeForecast({
        views,
        niche,
        ctrPercent,
        affiliateEpcUsd: epc,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beregning fejlede');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Indtægtsberegner</h2>
      <p className="text-[10px] text-zinc-400 mt-1">
        Estimater fra RPM-kataloget — ikke live AdSense. Kilde markeres eksplicit.
      </p>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
          Views
          <input
            type="number"
            min={0}
            value={views}
            onChange={(event) => setViews(Number(event.target.value))}
            className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
          />
        </label>
        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
          CTR %
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={ctrPercent}
            onChange={(event) => setCtrPercent(Number(event.target.value))}
            className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
          />
        </label>
        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
          EPC USD
          <input
            type="number"
            min={0}
            step={0.01}
            value={epc}
            onChange={(event) => setEpc(Number(event.target.value))}
            className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={handleCalculate}
        disabled={busy}
        className="mt-3 w-full rounded-xl bg-amber-300 text-zinc-950 text-[11px] font-black uppercase tracking-widest py-2 cursor-pointer disabled:opacity-50"
      >
        {busy ? 'Beregner…' : 'Beregn estimat'}
      </button>
      {error && <p className="mt-2 text-[11px] text-red-300">{error}</p>}
      {result && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] text-zinc-400">
            Niche {result.niche} · kilde {result.source}
          </p>
          {result.rows.map((row) => (
            <div key={row.partner} className="flex justify-between text-[11px] text-zinc-200">
              <span>{PARTNER_LABELS[row.partner]}</span>
              <span className="font-mono">{formatUsd(row.totalUsd)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-black text-amber-200 border-t border-zinc-800 pt-2">
            <span>Total</span>
            <span>{formatUsd(result.totalUsd)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
