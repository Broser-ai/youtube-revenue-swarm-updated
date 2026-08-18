import type {
  MetricTracker,
  MonetizeBreakdownRow,
  MonetizeResult,
  PartnerProgramKey,
} from '../../src/types.ts';
import { rpmBandForNiche, rpmForPartner, normalizeNiche } from './catalog.ts';

const PARTNERS: PartnerProgramKey[] = [
  'youtube_ypp',
  'youtube_shorts',
  'tiktok_rewards',
  'meta_reels',
  'x_ads_share',
  'affiliate_epc',
];

export function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}

export function estimateAdRevenueUsd(views: number, rpmUsd: number): number {
  if (!Number.isFinite(views) || !Number.isFinite(rpmUsd) || views < 0 || rpmUsd < 0) {
    return 0;
  }
  return roundUsd((views / 1000) * rpmUsd);
}

export function estimateClicks(views: number, ctrPercent: number): number {
  if (!Number.isFinite(views) || !Number.isFinite(ctrPercent) || views < 0 || ctrPercent < 0) {
    return 0;
  }
  return Math.round(views * (ctrPercent / 100));
}

export function estimateAffiliateRevenueUsd(clicks: number, epcUsd: number): number {
  if (!Number.isFinite(clicks) || !Number.isFinite(epcUsd) || clicks < 0 || epcUsd < 0) {
    return 0;
  }
  return roundUsd(clicks * epcUsd);
}

export function viewShareForPartner(partner: PartnerProgramKey, totalViews: number): number {
  switch (partner) {
    case 'youtube_ypp':
      return Math.round(totalViews * 0.42);
    case 'youtube_shorts':
      return Math.round(totalViews * 0.18);
    case 'tiktok_rewards':
      return Math.round(totalViews * 0.22);
    case 'meta_reels':
      return Math.round(totalViews * 0.1);
    case 'x_ads_share':
      return Math.round(totalViews * 0.05);
    case 'affiliate_epc':
      return Math.round(totalViews * 0.03);
    default: {
      const exhaustive: never = partner;
      return exhaustive;
    }
  }
}

export function monetize(input: {
  views: number;
  niche: string;
  ctrPercent?: number;
  affiliateEpcUsd?: number;
}): MonetizeResult {
  const niche = normalizeNiche(input.niche);
  const band = rpmBandForNiche(niche);
  const ctr = input.ctrPercent ?? band.ctrPercent;
  const epc = input.affiliateEpcUsd ?? band.affiliateEpc;
  const rows: MonetizeBreakdownRow[] = PARTNERS.map((partner) => {
    const views = viewShareForPartner(partner, input.views);
    const rpmUsd = partner === 'affiliate_epc' ? 0 : rpmForPartner(niche, partner);
    const clicks = estimateClicks(views, partner === 'affiliate_epc' ? ctr : ctr * 0.35);
    const adRevenueUsd = partner === 'affiliate_epc' ? 0 : estimateAdRevenueUsd(views, rpmUsd);
    const affiliateRevenueUsd =
      partner === 'affiliate_epc' ? estimateAffiliateRevenueUsd(clicks, epc) : 0;
    return {
      partner,
      views,
      rpmUsd,
      clicks,
      adRevenueUsd,
      affiliateRevenueUsd,
      totalUsd: roundUsd(adRevenueUsd + affiliateRevenueUsd),
    };
  });

  const totalAdUsd = roundUsd(rows.reduce((sum, row) => sum + row.adRevenueUsd, 0));
  const totalAffiliateUsd = roundUsd(rows.reduce((sum, row) => sum + row.affiliateRevenueUsd, 0));

  return {
    niche,
    source: 'estimate_catalog',
    rows,
    totalAdUsd,
    totalAffiliateUsd,
    totalUsd: roundUsd(totalAdUsd + totalAffiliateUsd),
  };
}

export function trackerFromRow(
  row: MonetizeBreakdownRow,
  avdSeconds: number,
  ctrPercent: number,
): MetricTracker {
  return {
    id: `metric_${row.partner}`,
    partner: row.partner,
    views: row.views,
    rpmUsd: row.rpmUsd,
    cpmUsd: roundUsd(row.rpmUsd * 0.72),
    avdSeconds,
    ctrPercent,
    estimatedAdRevenueUsd: row.adRevenueUsd,
    estimatedAffiliateRevenueUsd: row.affiliateRevenueUsd,
    recordedAt: new Date().toISOString(),
    source: 'estimate_catalog',
  };
}
