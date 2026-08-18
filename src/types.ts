export interface Voucher {
  id: string;
  title: string;
  partner: string;
  code: string;
  emoji: string;
  cost: number;
  expiryDate: string;
  isUsed: boolean;
  category?: 'coupon' | 'code' | 'award';
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  isLoggedIn: boolean;
  municipality: string;
  balance: number; // in DKK (kr)
  points: number;  // Cirkel Points (CP)
  scansCount: number;
  co2SavedKg: number;
  streakDays: number;
  level: number;
  memberStatus: string;
  xp?: number; // current XP for level up (e.g. 0 to 100)
  vouchers?: Voucher[]; // claimed active vouchers
  referralCode?: string; // unique user invite code
  phoneNumber?: string; // mobile pay phone number
  hasAppliedReferral?: boolean; // whether they entered referral rewards code
  claimedBadgeIds?: string[]; // list of badge IDs where double bonus CP was claimed
  verificationTier?: 'standard' | 'cpr' | 'mitid'; // Trust/Verification tier
  isMitIDVerified?: boolean; // True if upgraded/logged-in with MitID
  dailyRecyclingGoal?: number; // Daily recycling goal
  scannedCodes?: string[]; // List of scanned unique barcode/QR links or image hashes to prevent duplicate rewards
}

export interface ScanResult {
  productName: string;
  materialShort: string;
  grade: string;
  co2Saved: string;
  waterSaved: string;
  energySaved: string;
  pantValue: string;
  materialType: string;
  recyclablePercent: string;
  manufacturer: string;
  packagingWeight: string;
  circularScore: string;
  eprStatus: string;
  sortingType: string;
  sortingInstructions: string;
  didYouKnow?: string;
}

export interface Transaction {
  id: string;
  title: string;
  date: string;
  amount: string;
  isPoints?: boolean;
}

export interface RewardOffer {
  id: string;
  emoji: string;
  partner: string;
  description: string;
  cost: number;
  category?: 'coupon' | 'code' | 'award';
}

export type PartnerProgramKey =
  | 'youtube_ypp'
  | 'youtube_shorts'
  | 'tiktok_rewards'
  | 'meta_reels'
  | 'x_ads_share'
  | 'affiliate_epc';

export type SwarmAgentId =
  | 'orchestrator'
  | 'alpha_trends'
  | 'beta_scripts'
  | 'gamma_visuals'
  | 'delta_dispatch'
  | 'epsilon_monetization'
  | 'vault_officer'
  | 'qa_auditor';

export type AgentRunStatus = 'idle' | 'queued' | 'running' | 'complete' | 'error';

export type MetricSource = 'estimate_catalog' | 'youtube_data_api' | 'user_input';

export interface ApiErrorBody {
  status: 'error';
  code: 'INVALID_INPUT' | 'INVALID_URL' | 'UPSTREAM_UNAVAILABLE' | 'VAULT_MISSING' | 'GENERATION_FAILED';
  missing: string[];
  message: string;
}

export interface AgentState {
  id: SwarmAgentId;
  name: string;
  role: string;
  status: AgentRunStatus;
  progress: number;
  lastMessage: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface MetricTracker {
  id: string;
  partner: PartnerProgramKey;
  views: number;
  rpmUsd: number;
  cpmUsd: number;
  avdSeconds: number;
  ctrPercent: number;
  estimatedAdRevenueUsd: number;
  estimatedAffiliateRevenueUsd: number;
  recordedAt: string;
  source: MetricSource;
}

export interface ChapterMarker {
  timestamp: string;
  title: string;
}

export interface AffiliatePlacement {
  label: string;
  url: string;
  placement: 'description' | 'pinned_comment' | 'midroll_verbal' | 'end_screen';
}

export interface GeneratedPost {
  id: string;
  partner: PartnerProgramKey;
  title: string;
  hook: string;
  script: string;
  description: string;
  tags: string[];
  chapters: ChapterMarker[];
  thumbnailPrompt: string;
  pinnedComment: string;
  cta: string;
  affiliateLinks: AffiliatePlacement[];
  estimatedMetrics: MetricTracker;
}

export interface TrendKeyword {
  keyword: string;
  partner: PartnerProgramKey;
  searchVolumeLabel: string;
  rpmHintUsd: number;
  source: MetricSource;
  sampleTitle?: string;
  videoId?: string;
}

export interface VaultStatus {
  gemini: boolean;
  youtube: boolean;
  tiktok: boolean;
  meta: boolean;
  x: boolean;
  openai: boolean;
}

export interface DispatchPackage {
  partner: PartnerProgramKey;
  title: string;
  body: string;
  tags: string[];
  pinnedComment: string;
}

export interface SwarmRunResult {
  runId: string;
  topic: string;
  niche: string;
  language: 'da' | 'en';
  agents: AgentState[];
  posts: GeneratedPost[];
  metrics: MetricTracker[];
  trends: TrendKeyword[];
  dispatch: DispatchPackage[];
  vault: VaultStatus;
  qaFindings: string[];
  youtubeLive: boolean;
  youtubeNote: string | null;
  createdAt: string;
}

export interface MonetizeRequest {
  views: number;
  niche: string;
  ctrPercent: number;
  affiliateEpcUsd?: number;
}

export interface MonetizeBreakdownRow {
  partner: PartnerProgramKey;
  views: number;
  rpmUsd: number;
  clicks: number;
  adRevenueUsd: number;
  affiliateRevenueUsd: number;
  totalUsd: number;
}

export interface MonetizeResult {
  niche: string;
  source: MetricSource;
  rows: MonetizeBreakdownRow[];
  totalAdUsd: number;
  totalAffiliateUsd: number;
  totalUsd: number;
}
