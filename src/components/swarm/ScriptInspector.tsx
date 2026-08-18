import React, { useMemo, useState } from 'react';
import type { GeneratedPost, PartnerProgramKey } from '../../types';
import { PARTNER_LABELS } from '../../lib/swarmLabels';
import CopyButton from './CopyButton';

interface ScriptInspectorProps {
  posts: GeneratedPost[];
}

export default function ScriptInspector({ posts }: ScriptInspectorProps) {
  const [activeId, setActiveId] = useState<PartnerProgramKey | null>(posts[0]?.partner ?? null);
  const selected = useMemo(
    () => posts.find((post) => post.partner === activeId) ?? posts[0],
    [posts, activeId],
  );

  if (!selected) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Script Inspector</h2>
        <p className="text-sm text-zinc-400 mt-3">Kør sværmen for at inspicere manuskripter.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Script Inspector</h2>
        <CopyButton value={`${selected.title}\n\n${selected.hook}\n\n${selected.script}`} label="Kopiér script" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {posts.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => setActiveId(post.partner)}
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md cursor-pointer ${
              selected.partner === post.partner
                ? 'bg-amber-300 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {PARTNER_LABELS[post.partner]}
          </button>
        ))}
      </div>
      <h3 className="text-sm font-black text-zinc-50 leading-snug">{selected.title}</h3>
      <p className="mt-2 text-[11px] font-bold text-amber-200">{selected.hook}</p>
      <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-200 font-sans bg-zinc-900/80 rounded-xl p-3 border border-zinc-800">
        {selected.script}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton value={selected.hook} label="Hook" />
        <CopyButton value={selected.cta} label="CTA" />
        <CopyButton value={selected.pinnedComment} label="Pin" />
        <CopyButton value={selected.tags.join(', ')} label="Tags" />
      </div>
    </section>
  );
}
