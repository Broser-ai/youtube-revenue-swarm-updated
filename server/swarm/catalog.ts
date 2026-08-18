import type { PartnerProgramKey } from '../../src/types.ts';

export interface NicheRpmBand {
  youtubeLong: number;
  youtubeShorts: number;
  tiktok: number;
  meta: number;
  x: number;
  affiliateEpc: number;
  avdLongSeconds: number;
  ctrPercent: number;
}

const DEFAULT_BAND: NicheRpmBand = {
  youtubeLong: 4.2,
  youtubeShorts: 0.05,
  tiktok: 0.4,
  meta: 0.28,
  x: 0.1,
  affiliateEpc: 0.55,
  avdLongSeconds: 210,
  ctrPercent: 4.2,
};

const NICHE_RPM: Record<string, NicheRpmBand> = {
  finance: {
    youtubeLong: 12.4,
    youtubeShorts: 0.08,
    tiktok: 0.65,
    meta: 0.42,
    x: 0.18,
    affiliateEpc: 1.85,
    avdLongSeconds: 320,
    ctrPercent: 5.1,
  },
  insurance: {
    youtubeLong: 18.6,
    youtubeShorts: 0.07,
    tiktok: 0.5,
    meta: 0.38,
    x: 0.14,
    affiliateEpc: 2.4,
    avdLongSeconds: 280,
    ctrPercent: 4.6,
  },
  software: {
    youtubeLong: 9.8,
    youtubeShorts: 0.06,
    tiktok: 0.55,
    meta: 0.35,
    x: 0.16,
    affiliateEpc: 1.4,
    avdLongSeconds: 360,
    ctrPercent: 5.8,
  },
  recycling: {
    youtubeLong: 5.1,
    youtubeShorts: 0.05,
    tiktok: 0.48,
    meta: 0.31,
    x: 0.11,
    affiliateEpc: 0.72,
    avdLongSeconds: 240,
    ctrPercent: 4.8,
  },
  health: {
    youtubeLong: 7.4,
    youtubeShorts: 0.06,
    tiktok: 0.7,
    meta: 0.4,
    x: 0.12,
    affiliateEpc: 1.05,
    avdLongSeconds: 250,
    ctrPercent: 5.4,
  },
  education: {
    youtubeLong: 6.2,
    youtubeShorts: 0.05,
    tiktok: 0.44,
    meta: 0.3,
    x: 0.13,
    affiliateEpc: 0.9,
    avdLongSeconds: 400,
    ctrPercent: 4.4,
  },
};

export function normalizeNiche(raw: string | undefined): string {
  const key = (raw || 'recycling').trim().toLowerCase();
  if (key in NICHE_RPM) {
    return key;
  }
  if (key.includes('penge') || key.includes('invest') || key.includes('økonom')) {
    return 'finance';
  }
  if (key.includes('forsikr')) {
    return 'insurance';
  }
  if (key.includes('saas') || key.includes('software') || key.includes('app')) {
    return 'software';
  }
  if (key.includes('sund') || key.includes('health')) {
    return 'health';
  }
  if (key.includes('lær') || key.includes('uddann') || key.includes('school')) {
    return 'education';
  }
  if (key.includes('genbrug') || key.includes('cirkel') || key.includes('klima') || key.includes('affald')) {
    return 'recycling';
  }
  return 'recycling';
}

export function rpmBandForNiche(niche: string): NicheRpmBand {
  return NICHE_RPM[normalizeNiche(niche)] ?? DEFAULT_BAND;
}

export function rpmForPartner(niche: string, partner: PartnerProgramKey): number {
  const band = rpmBandForNiche(niche);
  switch (partner) {
    case 'youtube_ypp':
      return band.youtubeLong;
    case 'youtube_shorts':
      return band.youtubeShorts;
    case 'tiktok_rewards':
      return band.tiktok;
    case 'meta_reels':
      return band.meta;
    case 'x_ads_share':
      return band.x;
    case 'affiliate_epc':
      return band.affiliateEpc;
    default: {
      const exhaustive: never = partner;
      return exhaustive;
    }
  }
}

export const STATIC_TREND_CATALOG: Array<{
  keyword: string;
  partner: PartnerProgramKey;
  searchVolumeLabel: string;
  niche: string;
}> = [
  { keyword: 'pant app Danmark 2026', partner: 'youtube_ypp', searchVolumeLabel: 'mid', niche: 'recycling' },
  { keyword: 'sådan sorterer du PP5', partner: 'youtube_shorts', searchVolumeLabel: 'high', niche: 'recycling' },
  { keyword: 'EPR emballageafgift forklaring', partner: 'youtube_ypp', searchVolumeLabel: 'mid', niche: 'recycling' },
  { keyword: 'genbrug hacks lejlighed', partner: 'tiktok_rewards', searchVolumeLabel: 'high', niche: 'recycling' },
  { keyword: 'CSRD scope 3 for SMV', partner: 'youtube_ypp', searchVolumeLabel: 'low', niche: 'software' },
  { keyword: 'invester i cirkulær økonomi', partner: 'x_ads_share', searchVolumeLabel: 'mid', niche: 'finance' },
  { keyword: 'reels pant challenge', partner: 'meta_reels', searchVolumeLabel: 'high', niche: 'recycling' },
  { keyword: 'bedste cashback kort 2026', partner: 'affiliate_epc', searchVolumeLabel: 'high', niche: 'finance' },
];
