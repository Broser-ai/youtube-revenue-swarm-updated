import type { PartnerProgramKey, TrendKeyword } from '../../src/types.ts';
import { rpmForPartner, STATIC_TREND_CATALOG, normalizeNiche } from './catalog.ts';
import { isApiError } from './errors.ts';
import { searchYoutubeTrends } from './youtube.ts';

function catalogTrends(query: string, niche: string): TrendKeyword[] {
  const needle = query.trim().toLowerCase();
  const filtered = STATIC_TREND_CATALOG.filter((row) => {
    if (!needle) {
      return row.niche === niche || niche === 'recycling';
    }
    return (
      row.keyword.toLowerCase().includes(needle) ||
      needle.split(/\s+/).some((token) => row.keyword.toLowerCase().includes(token))
    );
  });
  const rows = filtered.length > 0 ? filtered : STATIC_TREND_CATALOG;
  return rows.map((row) => ({
    keyword: row.keyword,
    partner: row.partner,
    searchVolumeLabel: row.searchVolumeLabel,
    rpmHintUsd: rpmForPartner(row.niche, row.partner),
    source: 'estimate_catalog',
  }));
}

export async function collectTrends(input: {
  query: string;
  niche: string;
}): Promise<{ trends: TrendKeyword[]; youtubeLive: boolean; youtubeNote: string | null }> {
  const niche = normalizeNiche(input.niche);
  const catalog = catalogTrends(input.query, niche);
  const live = await searchYoutubeTrends(input.query || catalog[0]?.keyword || 'genbrug Danmark', 6);

  if (isApiError(live)) {
    return {
      trends: catalog,
      youtubeLive: false,
      youtubeNote: `${live.code}: ${live.message}`,
    };
  }

  const youtubeTrends: TrendKeyword[] = live.map((hit) => ({
    keyword: hit.title,
    partner: 'youtube_ypp' as PartnerProgramKey,
    searchVolumeLabel: hit.viewCount !== null ? `${hit.viewCount} views` : 'live',
    rpmHintUsd: rpmForPartner(niche, 'youtube_ypp'),
    source: 'youtube_data_api',
    sampleTitle: hit.title,
    videoId: hit.videoId,
  }));

  return {
    trends: [...youtubeTrends, ...catalog],
    youtubeLive: true,
    youtubeNote: null,
  };
}
