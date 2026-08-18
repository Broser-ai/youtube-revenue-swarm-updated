import React from 'react';
import type { GeneratedPost } from '../../types';
import CopyButton from './CopyButton';
import { PARTNER_LABELS } from '../../lib/swarmLabels';

interface ThumbnailPromptCardProps {
  posts: GeneratedPost[];
}

export default function ThumbnailPromptCard({ posts }: ThumbnailPromptCardProps) {
  if (posts.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Thumbnail prompts</h2>
        <p className="text-sm text-zinc-400 mt-3">Ingen prompts endnu.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Thumbnail prompts</h2>
      <div className="mt-3 space-y-3 max-h-80 overflow-auto pr-1">
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                {PARTNER_LABELS[post.partner]}
              </p>
              <CopyButton value={post.thumbnailPrompt} label="Prompt" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-300">{post.thumbnailPrompt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
