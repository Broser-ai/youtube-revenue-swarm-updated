import type { PartnerProgramKey, SwarmAgentId } from '../types';

export const PARTNER_LABELS: Record<PartnerProgramKey, string> = {
  youtube_ypp: 'YouTube YPP',
  youtube_shorts: 'YouTube Shorts',
  tiktok_rewards: 'TikTok Rewards',
  meta_reels: 'Meta Reels',
  x_ads_share: 'X Ads Share',
  affiliate_epc: 'Affiliate EPC',
};

export const PARTNER_COLORS: Record<PartnerProgramKey, string> = {
  youtube_ypp: '#FF4D4D',
  youtube_shorts: '#FF8A8A',
  tiktok_rewards: '#69C9D0',
  meta_reels: '#4C8BF5',
  x_ads_share: '#E7E9EA',
  affiliate_epc: '#C8F24A',
};

export const AGENT_ICONS: Record<SwarmAgentId, string> = {
  orchestrator: '👑',
  alpha_trends: '🔍',
  beta_scripts: '✍️',
  gamma_visuals: '🎨',
  delta_dispatch: '🚀',
  epsilon_monetization: '💰',
  vault_officer: '🛡️',
  qa_auditor: '🧪',
};

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}
