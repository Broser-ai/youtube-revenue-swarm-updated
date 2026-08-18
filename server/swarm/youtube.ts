import { youtubeApiKey } from './vault.ts';
import { apiError } from './errors.ts';
import type { ApiErrorBody } from '../../src/types.ts';

export interface YoutubeTrendHit {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number | null;
  source: 'youtube_data_api';
}

interface YoutubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      publishedAt?: string;
    };
  }>;
  error?: { message?: string };
}

interface YoutubeVideosResponse {
  items?: Array<{
    id?: string;
    snippet?: { title?: string; channelTitle?: string; publishedAt?: string };
    statistics?: { viewCount?: string };
  }>;
  error?: { message?: string };
}

function parseCount(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function searchYoutubeTrends(
  query: string,
  maxResults: number,
): Promise<YoutubeTrendHit[] | ApiErrorBody> {
  const key = youtubeApiKey();
  if (!key) {
    return apiError(
      'VAULT_MISSING',
      ['YOUTUBE_API_KEY'],
      'YouTube Data API v3 er ikke konfigureret. Live search er deaktiveret; brug estimate_catalog.',
    );
  }

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', String(Math.min(Math.max(maxResults, 1), 10)));
  searchUrl.searchParams.set('order', 'viewCount');
  searchUrl.searchParams.set('relevanceLanguage', 'da');
  searchUrl.searchParams.set('key', key);

  let searchJson: YoutubeSearchResponse;
  try {
    const response = await fetch(searchUrl);
    searchJson = (await response.json()) as YoutubeSearchResponse;
    if (!response.ok) {
      return apiError(
        'UPSTREAM_UNAVAILABLE',
        [],
        searchJson.error?.message || `YouTube search.list svarede ${response.status}.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ukendt netværksfejl';
    return apiError('UPSTREAM_UNAVAILABLE', [], `YouTube search.list fejlede: ${message}`);
  }

  const ids = (searchJson.items || [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) {
    return [];
  }

  const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  videosUrl.searchParams.set('part', 'snippet,statistics');
  videosUrl.searchParams.set('id', ids.join(','));
  videosUrl.searchParams.set('key', key);

  let videosJson: YoutubeVideosResponse;
  try {
    const response = await fetch(videosUrl);
    videosJson = (await response.json()) as YoutubeVideosResponse;
    if (!response.ok) {
      return apiError(
        'UPSTREAM_UNAVAILABLE',
        [],
        videosJson.error?.message || `YouTube videos.list svarede ${response.status}.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ukendt netværksfejl';
    return apiError('UPSTREAM_UNAVAILABLE', [], `YouTube videos.list fejlede: ${message}`);
  }

  return (videosJson.items || []).map((item) => ({
    videoId: item.id || '',
    title: item.snippet?.title || '',
    channelTitle: item.snippet?.channelTitle || '',
    publishedAt: item.snippet?.publishedAt || '',
    viewCount: parseCount(item.statistics?.viewCount),
    source: 'youtube_data_api' as const,
  }));
}
