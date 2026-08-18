import React, { useMemo, useState } from 'react';
import type { DispatchPackage } from '../../types';
import { PARTNER_LABELS } from '../../lib/swarmLabels';
import CopyButton from './CopyButton';

interface DispatchPreviewProps {
  packages: DispatchPackage[];
}

export default function DispatchPreview({ packages }: DispatchPreviewProps) {
  const [index, setIndex] = useState(0);
  const selected = useMemo(() => packages[index] ?? packages[0], [packages, index]);

  if (!selected) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Dispatcher</h2>
        <p className="text-sm text-zinc-400 mt-3">Ingen metadata klar.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Omni-channel dispatcher</h2>
        <CopyButton value={`${selected.title}\n\n${selected.body}\n\n${selected.pinnedComment}`} label="Kopiér pakke" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {packages.map((pack, packIndex) => (
          <button
            key={`${pack.partner}-${packIndex}`}
            type="button"
            onClick={() => setIndex(packIndex)}
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md cursor-pointer ${
              selected.partner === pack.partner && index === packIndex
                ? 'bg-amber-300 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {PARTNER_LABELS[pack.partner]}
          </button>
        ))}
      </div>
      <p className="text-sm font-black text-zinc-50">{selected.title}</p>
      <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-200 font-sans bg-zinc-900/80 rounded-xl p-3 border border-zinc-800">
        {selected.body}
      </pre>
      <p className="mt-2 text-[11px] text-amber-100">Pin: {selected.pinnedComment}</p>
    </section>
  );
}
