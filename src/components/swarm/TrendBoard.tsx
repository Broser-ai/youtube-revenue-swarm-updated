import React from 'react';
import type { TrendKeyword } from '../../types';
import { PARTNER_LABELS } from '../../lib/swarmLabels';

interface TrendBoardProps {
  trends: TrendKeyword[];
  youtubeLive: boolean;
  youtubeNote: string | null;
}

export default function TrendBoard({ trends, youtubeLive, youtubeNote }: TrendBoardProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Trends & keywords</h2>
        <span className={`text-[9px] font-black uppercase tracking-widest ${youtubeLive ? 'text-lime-300' : 'text-zinc-500'}`}>
          {youtubeLive ? 'YouTube live' : 'katalog'}
        </span>
      </div>
      {youtubeNote && <p className="mt-1 text-[10px] text-amber-100/80">{youtubeNote}</p>}
      <div className="mt-3 space-y-1.5 max-h-56 overflow-auto">
        {trends.length === 0 && <p className="text-sm text-zinc-400">Ingen trends indlæst.</p>}
        {trends.map((trend, index) => (
          <div key={`${trend.keyword}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 px-2.5 py-1.5">
            <div>
              <p className="text-[11px] text-zinc-100 leading-snug">{trend.keyword}</p>
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                {PARTNER_LABELS[trend.partner]} · {trend.source} · {trend.searchVolumeLabel}
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-200">${trend.rpmHintUsd.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
