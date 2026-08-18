import React from 'react';
import type { AgentState } from '../../types';
import { AGENT_ICONS } from '../../lib/swarmLabels';

interface AgentSwarmPanelProps {
  agents: AgentState[];
  running: boolean;
}

function statusClass(status: AgentState['status']): string {
  switch (status) {
    case 'idle':
      return 'text-zinc-400 border-zinc-700';
    case 'queued':
      return 'text-zinc-300 border-zinc-600';
    case 'running':
      return 'text-amber-200 border-amber-400/40';
    case 'complete':
      return 'text-lime-300 border-lime-400/30';
    case 'error':
      return 'text-red-300 border-red-400/40';
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export default function AgentSwarmPanel({ agents, running }: AgentSwarmPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">S-H Agent Swarm</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {running ? 'Kører' : 'Klar'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {agents.map((agent) => (
          <article
            key={agent.id}
            className={`rounded-xl border px-3 py-2.5 ${statusClass(agent.status)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-wide">
                {AGENT_ICONS[agent.id]} {agent.name}
              </p>
              <span className="text-[9px] font-mono">{agent.progress}%</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">{agent.role}</p>
            <p className="text-[10px] text-zinc-200 mt-1 leading-snug">{agent.lastMessage}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
