import React, { useEffect, useMemo, useState } from 'react';
import { Play, Radio } from 'lucide-react';
import type { AgentState, PartnerProgramKey, SwarmRunResult } from '../../types';
import { runSwarm, type SwarmRunPayload } from '../../lib/swarmClient';
import AgentSwarmPanel from './AgentSwarmPanel';
import ScriptInspector from './ScriptInspector';
import RevenueCalculator from './RevenueCalculator';
import ThumbnailPromptCard from './ThumbnailPromptCard';
import ApiVaultPanel from './ApiVaultPanel';
import TrendBoard from './TrendBoard';
import DispatchPreview from './DispatchPreview';
import MetricCharts from './MetricCharts';
import { PARTNER_LABELS } from '../../lib/swarmLabels';

const LAST_RUN_KEY = 'cirkel_swarm_last_run';

const ALL_PLATFORMS: PartnerProgramKey[] = [
  'youtube_ypp',
  'youtube_shorts',
  'tiktok_rewards',
  'meta_reels',
  'x_ads_share',
  'affiliate_epc',
];

const IDLE_AGENTS: AgentState[] = [
  { id: 'orchestrator', name: 'Master Orchestrator', role: 'Dirigent', status: 'idle', progress: 0, lastMessage: 'Venter', startedAt: null, completedAt: null },
  { id: 'alpha_trends', name: 'Trend Scraper', role: 'Keywords', status: 'idle', progress: 0, lastMessage: 'Venter', startedAt: null, completedAt: null },
  { id: 'beta_scripts', name: 'Script Engineer', role: 'Hooks', status: 'idle', progress: 0, lastMessage: 'Venter', startedAt: null, completedAt: null },
  { id: 'gamma_visuals', name: 'Thumbnail Architect', role: 'Visuals', status: 'idle', progress: 0, lastMessage: 'Venter', startedAt: null, completedAt: null },
  { id: 'delta_dispatch', name: 'Dispatcher', role: 'Metadata', status: 'idle', progress: 0, lastMessage: 'Venter', startedAt: null, completedAt: null },
  { id: 'epsilon_monetization', name: 'EPC Optimizer', role: 'RPM', status: 'idle', progress: 0, lastMessage: 'Venter', startedAt: null, completedAt: null },
  { id: 'vault_officer', name: 'Vault Officer', role: 'Nøgler', status: 'idle', progress: 0, lastMessage: 'Venter', startedAt: null, completedAt: null },
  { id: 'qa_auditor', name: 'QA Auditor', role: 'Validering', status: 'idle', progress: 0, lastMessage: 'Venter', startedAt: null, completedAt: null },
];

export default function SwarmDashboard() {
  const [topic, setTopic] = useState('PP5 pant-loop i Aarhus');
  const [niche, setNiche] = useState('recycling');
  const [language, setLanguage] = useState<'da' | 'en'>('da');
  const [targetMinutes, setTargetMinutes] = useState(8);
  const [viewsAssumption, setViewsAssumption] = useState(25000);
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [affiliateLabel, setAffiliateLabel] = useState('Cirkel partnerlink');
  const [platforms, setPlatforms] = useState<PartnerProgramKey[]>(ALL_PLATFORMS);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SwarmRunResult | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(LAST_RUN_KEY);
    if (!cached) {
      return;
    }
    try {
      setResult(JSON.parse(cached) as SwarmRunResult);
    } catch {
      localStorage.removeItem(LAST_RUN_KEY);
    }
  }, []);

  const payload: SwarmRunPayload = useMemo(
    () => ({
      topic,
      niche,
      language,
      targetMinutes,
      viewsAssumption,
      platforms,
      affiliateUrl,
      affiliateLabel,
    }),
    [topic, niche, language, targetMinutes, viewsAssumption, platforms, affiliateUrl, affiliateLabel],
  );

  const togglePlatform = (partner: PartnerProgramKey) => {
    setPlatforms((current) => {
      if (current.includes(partner)) {
        const next = current.filter((item) => item !== partner);
        return next.length === 0 ? current : next;
      }
      return [...current, partner];
    });
  };

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await runSwarm(payload);
      setResult(data);
      localStorage.setItem(LAST_RUN_KEY, JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swarm-kørsel fejlede');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="swarm-shell min-h-[750px] w-full bg-[#07070a] text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">Cirkel Revenue Swarm</p>
          <h1 className="text-xl font-black tracking-tight">YouTube & Multi-Partner Orchestrator</h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-400">
          <Radio className="w-3.5 h-3.5 text-lime-300" />
          {result ? `Seneste run ${result.runId.slice(0, 8)}` : 'Ingen kørsel endnu'}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 md:p-6">
        <div className="xl:col-span-4 space-y-4">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Run setup</h2>
            <label className="block mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">
              Emne
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                Niche
                <input
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
                />
              </label>
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                Sprog
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value === 'en' ? 'en' : 'da')}
                  className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
                >
                  <option value="da">Dansk</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                Minutter
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={targetMinutes}
                  onChange={(event) => setTargetMinutes(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
                />
              </label>
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                Views-antagelse
                <input
                  type="number"
                  min={0}
                  value={viewsAssumption}
                  onChange={(event) => setViewsAssumption(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-100"
                />
              </label>
            </div>
            <label className="block mt-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
              Affiliate URL (valgfri)
              <input
                value={affiliateUrl}
                onChange={(event) => setAffiliateUrl(event.target.value)}
                placeholder="https://"
                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="block mt-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
              Affiliate-label
              <input
                value={affiliateLabel}
                onChange={(event) => setAffiliateLabel(event.target.value)}
                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ALL_PLATFORMS.map((partner) => {
                const on = platforms.includes(partner);
                return (
                  <button
                    key={partner}
                    type="button"
                    onClick={() => togglePlatform(partner)}
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md cursor-pointer ${
                      on ? 'bg-amber-300 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {PARTNER_LABELS[partner]}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 text-zinc-950 text-[11px] font-black uppercase tracking-widest py-2.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {running ? 'Sværmen kører…' : 'Kør 8-agent swarm'}
            </button>
            {error && <p className="mt-2 text-[11px] text-red-300">{error}</p>}
            {result && result.qaFindings.length > 0 && (
              <ul className="mt-2 text-[11px] text-amber-100 list-disc pl-4">
                {result.qaFindings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            )}
          </section>
          <AgentSwarmPanel agents={result?.agents ?? IDLE_AGENTS} running={running} />
          <ApiVaultPanel />
        </div>

        <div className="xl:col-span-8 space-y-4">
          <TrendBoard
            trends={result?.trends ?? []}
            youtubeLive={Boolean(result?.youtubeLive)}
            youtubeNote={result?.youtubeNote ?? null}
          />
          <ScriptInspector posts={result?.posts ?? []} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ThumbnailPromptCard posts={result?.posts ?? []} />
            <RevenueCalculator niche={niche} defaultViews={viewsAssumption} />
          </div>
          <DispatchPreview packages={result?.dispatch ?? []} />
          <MetricCharts metrics={result?.metrics ?? []} />
        </div>
      </div>
    </div>
  );
}
