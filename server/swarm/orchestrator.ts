import type { AgentState, PartnerProgramKey, SwarmAgentId, SwarmRunResult } from '../../src/types.ts';
import { collectTrends } from './trends.ts';
import { buildPosts, DEFAULT_PLATFORMS, type ScriptRequest } from './scripts.ts';
import { applyThumbnailPrompts } from './thumbnails.ts';
import { buildDispatch } from './dispatcher.ts';
import { auditRun } from './qa.ts';
import { readVaultStatus } from './vault.ts';
import { normalizeNiche } from './catalog.ts';

const AGENT_META: Array<Pick<AgentState, 'id' | 'name' | 'role'>> = [
  {
    id: 'orchestrator',
    name: 'Master Orchestrator',
    role: 'Dirigerer sværmen og samler det færdige run.',
  },
  {
    id: 'alpha_trends',
    name: 'Trend & Keyword Scraper',
    role: 'Henter YouTube-live hits og merger med RPM-kataloget.',
  },
  {
    id: 'beta_scripts',
    name: 'Viral Script & Hook Engineer',
    role: 'Skriver hooks, scener, CTA og fulde manuskripter.',
  },
  {
    id: 'gamma_visuals',
    name: 'Visual & Thumbnail Architect',
    role: 'Bygger Midjourney/Flux/DALL-E thumbnail-prompts.',
  },
  {
    id: 'delta_dispatch',
    name: 'Omni-Channel Dispatcher',
    role: 'Formatterer metadata, tags, timestamps og pins.',
  },
  {
    id: 'epsilon_monetization',
    name: 'Monetization & EPC Optimizer',
    role: 'Beregner RPM/CPM/EPC-estimater pr. partnerprogram.',
  },
  {
    id: 'vault_officer',
    name: 'Zero-Trust Vault Officer',
    role: 'Rapporterer hvilke server-nøgler der er sat — uden at lække dem.',
  },
  {
    id: 'qa_auditor',
    name: 'QA & Edge-Case Auditor',
    role: 'Validerer completeness, tags, hooks og metric-alignment.',
  },
];

function idleAgents(): AgentState[] {
  return AGENT_META.map((meta) => ({
    ...meta,
    status: 'queued',
    progress: 0,
    lastMessage: 'I kø',
    startedAt: null,
    completedAt: null,
  }));
}

function completeAgent(
  agents: AgentState[],
  id: SwarmAgentId,
  message: string,
  status: AgentState['status'] = 'complete',
): AgentState[] {
  const now = new Date().toISOString();
  return agents.map((agent) =>
    agent.id === id
      ? {
          ...agent,
          status,
          progress: 100,
          lastMessage: message,
          startedAt: agent.startedAt ?? now,
          completedAt: now,
        }
      : agent,
  );
}

export async function runSwarm(request: ScriptRequest): Promise<SwarmRunResult> {
  const createdAt = new Date().toISOString();
  let agents = idleAgents();
  agents = completeAgent(agents, 'orchestrator', 'Run startet. Niche + platforme låst.');

  const vault = readVaultStatus();
  agents = completeAgent(
    agents,
    'vault_officer',
    `Vault: Gemini ${vault.gemini ? 'on' : 'off'}, YouTube ${vault.youtube ? 'on' : 'off'}, TikTok ${vault.tiktok ? 'on' : 'off'}, Meta ${vault.meta ? 'on' : 'off'}, X ${vault.x ? 'on' : 'off'}.`,
  );

  const trendPack = await collectTrends({ query: request.topic, niche: request.niche });
  agents = completeAgent(
    agents,
    'alpha_trends',
    trendPack.youtubeLive
      ? `Live YouTube Data API v3: ${trendPack.trends.filter((t) => t.source === 'youtube_data_api').length} hits.`
      : `YouTube live slået fra. ${trendPack.youtubeNote || 'Bruger estimate_catalog.'}`,
    trendPack.youtubeLive ? 'complete' : 'complete',
  );

  const platforms: PartnerProgramKey[] =
    request.platforms.length > 0 ? request.platforms : DEFAULT_PLATFORMS;
  let posts = buildPosts({ ...request, platforms, niche: normalizeNiche(request.niche) });
  agents = completeAgent(agents, 'beta_scripts', `${posts.length} platform-manuskripter skrevet.`);

  posts = applyThumbnailPrompts(posts, request.topic, request.language);
  agents = completeAgent(agents, 'gamma_visuals', 'Thumbnail-prompts klar til Midjourney/Flux/DALL-E.');

  const dispatch = buildDispatch(posts);
  agents = completeAgent(agents, 'delta_dispatch', `${dispatch.length} dispatch-pakker formatteret.`);

  const metrics = posts.map((post) => post.estimatedMetrics);
  agents = completeAgent(
    agents,
    'epsilon_monetization',
    `Estimat-kilde: estimate_catalog. ${metrics.length} metric-rækker.`,
  );

  const draft: Pick<SwarmRunResult, 'posts' | 'agents' | 'metrics'> = { posts, agents, metrics };
  const qaFindings = auditRun(draft);
  agents = completeAgent(
    agents,
    'qa_auditor',
    qaFindings.length === 0 ? 'QA godkendt. Ingen blockers.' : `${qaFindings.length} findings.`,
    qaFindings.some((finding) => finding.startsWith('Ingen posts')) ? 'error' : 'complete',
  );

  return {
    runId: crypto.randomUUID(),
    topic: request.topic,
    niche: normalizeNiche(request.niche),
    language: request.language,
    agents,
    posts,
    metrics,
    trends: trendPack.trends,
    dispatch,
    vault,
    qaFindings,
    youtubeLive: trendPack.youtubeLive,
    youtubeNote: trendPack.youtubeNote,
    createdAt,
  };
}
