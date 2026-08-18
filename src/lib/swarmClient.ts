import type {
  ApiErrorBody,
  GeneratedPost,
  MonetizeResult,
  PartnerProgramKey,
  SwarmRunResult,
  TrendKeyword,
  VaultStatus,
} from '../types';

export interface SwarmRunPayload {
  topic: string;
  niche: string;
  language: 'da' | 'en';
  targetMinutes: number;
  viewsAssumption: number;
  platforms: PartnerProgramKey[];
  affiliateUrl: string;
  affiliateLabel: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiErrorBody;
  if (!response.ok || (body && typeof body === 'object' && 'status' in body && body.status === 'error')) {
    const errorBody = body as ApiErrorBody;
    const message = errorBody.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export async function fetchVaultStatus(): Promise<VaultStatus> {
  const response = await fetch('/api/swarm/vault/status');
  const body = await readJson<{ configured: VaultStatus }>(response);
  return body.configured;
}

export async function fetchTrends(query: string, niche: string): Promise<{
  trends: TrendKeyword[];
  youtubeLive: boolean;
  youtubeNote: string | null;
}> {
  const params = new URLSearchParams({ q: query, niche });
  const response = await fetch(`/api/swarm/trends?${params.toString()}`);
  return readJson(response);
}

export async function runSwarm(payload: SwarmRunPayload): Promise<SwarmRunResult> {
  const response = await fetch('/api/swarm/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await readJson<{ data: SwarmRunResult }>(response);
  return body.data;
}

export async function generatePosts(payload: SwarmRunPayload): Promise<GeneratedPost[]> {
  const response = await fetch('/api/swarm/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await readJson<{ data: GeneratedPost[] }>(response);
  return body.data;
}

export async function monetizeForecast(input: {
  views: number;
  niche: string;
  ctrPercent: number;
  affiliateEpcUsd: number;
}): Promise<MonetizeResult> {
  const response = await fetch('/api/swarm/monetize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await readJson<{ data: MonetizeResult }>(response);
  return body.data;
}
