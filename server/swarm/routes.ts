import type { Express, Request, Response } from 'express';
import type { GoogleGenAI } from '@google/genai';
import type { PartnerProgramKey } from '../../src/types.ts';
import { apiError } from './errors.ts';
import { isApiError } from './errors.ts';
import { readVaultStatus } from './vault.ts';
import { collectTrends } from './trends.ts';
import { searchYoutubeTrends } from './youtube.ts';
import { monetize } from './monetization.ts';
import { runSwarm } from './orchestrator.ts';
import { DEFAULT_PLATFORMS } from './scripts.ts';
import { polishHooksWithGemini } from './geminiPolish.ts';
import { applyThumbnailPrompts } from './thumbnails.ts';
import { buildDispatch } from './dispatcher.ts';
import { auditPosts } from './qa.ts';

const PARTNER_KEYS: PartnerProgramKey[] = [
  'youtube_ypp',
  'youtube_shorts',
  'tiktok_rewards',
  'meta_reels',
  'x_ads_share',
  'affiliate_epc',
];

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePlatforms(value: unknown): PartnerProgramKey[] | null {
  if (value === undefined || value === null) {
    return DEFAULT_PLATFORMS;
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const parsed: PartnerProgramKey[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !PARTNER_KEYS.includes(item as PartnerProgramKey)) {
      return null;
    }
    parsed.push(item as PartnerProgramKey);
  }
  return parsed.length > 0 ? parsed : DEFAULT_PLATFORMS;
}

function parseLanguage(value: unknown): 'da' | 'en' {
  return value === 'en' ? 'en' : 'da';
}

function parseHttpUrl(value: unknown): string | null | 'invalid' {
  const raw = asString(value);
  if (!raw) {
    return null;
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'invalid';
    }
    return url.toString();
  } catch {
    return 'invalid';
  }
}

function parseRunBody(req: Request) {
  const topic = asString(req.body?.topic);
  const missing: string[] = [];
  if (topic.length < 3) {
    missing.push('topic');
  }
  const platforms = parsePlatforms(req.body?.platforms);
  if (platforms === null) {
    missing.push('platforms');
  }
  const affiliateUrl = parseHttpUrl(req.body?.affiliateUrl);
  if (affiliateUrl === 'invalid') {
    return { error: apiError('INVALID_URL', ['affiliateUrl'], 'affiliateUrl skal være en http(s)-URL.') };
  }
  const targetMinutes = asNumber(req.body?.targetMinutes, 8);
  const viewsAssumption = asNumber(req.body?.viewsAssumption, 25000);
  if (targetMinutes < 1 || targetMinutes > 60) {
    missing.push('targetMinutes');
  }
  if (viewsAssumption < 0 || viewsAssumption > 50_000_000) {
    missing.push('viewsAssumption');
  }
  if (missing.length > 0) {
    return { error: apiError('INVALID_INPUT', missing, 'Ugyldigt input til swarm-run.') };
  }
  return {
    request: {
      topic,
      niche: asString(req.body?.niche) || 'recycling',
      language: parseLanguage(req.body?.language),
      targetMinutes,
      affiliateUrl,
      affiliateLabel: asString(req.body?.affiliateLabel) || 'Partnerlink',
      viewsAssumption,
      platforms: platforms as PartnerProgramKey[],
    },
  };
}

export function mountSwarmRoutes(app: Express, ai: GoogleGenAI | null): void {
  app.get('/api/swarm/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'multi-partner-revenue-swarm', vault: readVaultStatus() });
  });

  app.get('/api/swarm/vault/status', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      configured: readVaultStatus(),
      neverExpose: true,
      note: 'Rå nøgler returneres aldrig. Sæt dem i server-miljøet eller i den krypterede browser-vault.',
    });
  });

  app.get('/api/swarm/trends', async (req: Request, res: Response) => {
    const query = asString(req.query.q);
    const niche = asString(req.query.niche) || 'recycling';
    const pack = await collectTrends({ query, niche });
    res.json({ status: 'ok', ...pack });
  });

  app.get('/api/swarm/youtube/search', async (req: Request, res: Response) => {
    const query = asString(req.query.q);
    if (query.length < 2) {
      return res.status(400).json(apiError('INVALID_INPUT', ['q'], 'Query q skal være mindst 2 tegn.'));
    }
    const maxResults = Math.min(Math.max(asNumber(req.query.maxResults, 6), 1), 10);
    const result = await searchYoutubeTrends(query, maxResults);
    if (isApiError(result)) {
      const status = result.code === 'VAULT_MISSING' ? 503 : 502;
      return res.status(status).json(result);
    }
    res.json({ status: 'ok', source: 'youtube_data_api', items: result });
  });

  app.post('/api/swarm/monetize', (req: Request, res: Response) => {
    const views = asNumber(req.body?.views, Number.NaN);
    if (!Number.isFinite(views) || views < 0) {
      return res.status(400).json(apiError('INVALID_INPUT', ['views'], 'views skal være et tal ≥ 0.'));
    }
    const ctrPercent = req.body?.ctrPercent === undefined ? undefined : asNumber(req.body.ctrPercent, Number.NaN);
    const affiliateEpcUsd =
      req.body?.affiliateEpcUsd === undefined ? undefined : asNumber(req.body.affiliateEpcUsd, Number.NaN);
    if (ctrPercent !== undefined && (!Number.isFinite(ctrPercent) || ctrPercent < 0 || ctrPercent > 100)) {
      return res.status(400).json(apiError('INVALID_INPUT', ['ctrPercent'], 'ctrPercent skal være 0-100.'));
    }
    if (affiliateEpcUsd !== undefined && (!Number.isFinite(affiliateEpcUsd) || affiliateEpcUsd < 0)) {
      return res.status(400).json(apiError('INVALID_INPUT', ['affiliateEpcUsd'], 'affiliateEpcUsd skal være ≥ 0.'));
    }
    res.json({
      status: 'ok',
      data: monetize({
        views,
        niche: asString(req.body?.niche) || 'recycling',
        ctrPercent,
        affiliateEpcUsd,
      }),
    });
  });

  app.post('/api/swarm/run', async (req: Request, res: Response) => {
    const parsed = parseRunBody(req);
    if ('error' in parsed && parsed.error) {
      const status = parsed.error.code === 'INVALID_URL' ? 400 : 400;
      return res.status(status).json(parsed.error);
    }
    try {
      const result = await runSwarm(parsed.request);
      result.posts = await polishHooksWithGemini(ai, result.posts, parsed.request.language);
      result.posts = applyThumbnailPrompts(result.posts, parsed.request.topic, parsed.request.language);
      result.dispatch = buildDispatch(result.posts);
      result.qaFindings = auditPosts(result.posts);
      res.json({ status: 'ok', data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ukendt fejl';
      res.status(500).json(apiError('GENERATION_FAILED', [], message));
    }
  });

  app.post('/api/swarm/generate', async (req: Request, res: Response) => {
    const parsed = parseRunBody(req);
    if ('error' in parsed && parsed.error) {
      return res.status(400).json(parsed.error);
    }
    try {
      const result = await runSwarm(parsed.request);
      const polished = await polishHooksWithGemini(ai, result.posts, parsed.request.language);
      res.json({ status: 'ok', data: polished });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ukendt fejl';
      res.status(500).json(apiError('GENERATION_FAILED', [], message));
    }
  });

  app.post('/api/swarm/dispatch', async (req: Request, res: Response) => {
    const parsed = parseRunBody(req);
    if ('error' in parsed && parsed.error) {
      return res.status(400).json(parsed.error);
    }
    const result = await runSwarm(parsed.request);
    res.json({ status: 'ok', data: result.dispatch });
  });
}
