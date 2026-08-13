import axios, { isAxiosError } from 'axios';
import { env } from '../config/env';
import { getCache } from '../cache';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import type { ProwlarrSearchResult, Resolution, TorrentRelease } from '../types/prowlarr';

// Torrent availability changes quickly (seeders/leechers) but re-querying every
// indexer on every page view is slow and can trip indexer rate limits, so we
// cache briefly rather than not at all.
const SEARCH_TTL_SECONDS = 5 * 60;
const MOVIES_CATEGORY = 2000;

function isConfigured(): boolean {
  return Boolean(env.PROWLARR_URL && env.PROWLARR_API_KEY);
}

function assertConfigured(): void {
  if (!isConfigured()) {
    throw ApiError.serviceUnavailable(
      'Prowlarr is not configured. Set PROWLARR_URL and PROWLARR_API_KEY in the backend .env file.',
    );
  }
}

function getClient() {
  return axios.create({
    baseURL: env.PROWLARR_URL,
    timeout: 25000,
    headers: { 'X-Api-Key': env.PROWLARR_API_KEY },
  });
}

function parseResolution(title: string): Resolution {
  const t = title.toLowerCase();
  if (/\b(2160p|4k|uhd)\b/.test(t)) return '2160p';
  if (/\b1080p\b/.test(t)) return '1080p';
  if (/\b720p\b/.test(t)) return '720p';
  if (/\b480p\b/.test(t)) return '480p';
  return 'Unknown';
}

function isMagnetUri(value: string | undefined): value is string {
  return typeof value === 'string' && value.startsWith('magnet:');
}

function isHttpUrl(value: string | undefined): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

interface TorrentLink {
  url: string;
  isMagnet: boolean;
}

/**
 * Resolves the best link we have for sending this release to Seedr.
 *
 * Prowlarr's `magnetUrl`/`downloadUrl` fields are not reliably actual magnet
 * URIs — for indexers Prowlarr proxies downloads for, they're often a
 * `{PROWLARR_URL}/.../download?...` redirect link instead, while the real
 * magnet (when the indexer has one) sometimes shows up in `guid` instead
 * (common for Pirate-Bay-style indexers). We prefer a genuine `magnet:` URI
 * wherever it's found; if there isn't one, we fall back to whatever http(s)
 * download link is available (typically Prowlarr's own proxy) rather than
 * giving up — Seedr's `POST /tasks` fetches whatever URL it's given, so a
 * direct link to the .torrent file works just as well as a magnet.
 */
function extractTorrentLink(result: ProwlarrSearchResult): TorrentLink | null {
  if (isMagnetUri(result.magnetUrl)) return { url: result.magnetUrl, isMagnet: true };
  if (isMagnetUri(result.downloadUrl)) return { url: result.downloadUrl, isMagnet: true };
  if (isMagnetUri(result.guid)) return { url: result.guid, isMagnet: true };

  if (isHttpUrl(result.downloadUrl)) return { url: result.downloadUrl, isMagnet: false };
  if (isHttpUrl(result.magnetUrl)) return { url: result.magnetUrl, isMagnet: false };

  return null;
}

function mapResult(result: ProwlarrSearchResult): TorrentRelease | null {
  const releaseName = result.title?.trim();
  if (!releaseName || !result.guid) return null;

  const link = extractTorrentLink(result);

  return {
    guid: result.guid,
    releaseName,
    resolution: parseResolution(releaseName),
    sizeBytes: typeof result.size === 'number' ? result.size : 0,
    seeders: typeof result.seeders === 'number' ? result.seeders : 0,
    leechers: typeof result.leechers === 'number' ? result.leechers : 0,
    indexer: result.indexer ?? 'Unknown indexer',
    publishDate: result.publishDate ?? null,
    torrentUrl: link?.url ?? null,
    isMagnet: link?.isMagnet ?? false,
    infoUrl: result.infoUrl ?? null,
  };
}

function handleProwlarrError(err: unknown): never {
  if (isAxiosError(err)) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'EHOSTUNREACH') {
      throw ApiError.badGateway(
        `Prowlarr is unreachable at ${env.PROWLARR_URL}. Check that it's running and PROWLARR_URL is correct.`,
      );
    }
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      throw ApiError.gatewayTimeout(
        'Prowlarr took too long to respond. It may be searching too many indexers — try again shortly.',
      );
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      throw ApiError.badGateway('Prowlarr rejected the request. Check PROWLARR_API_KEY.');
    }
    throw ApiError.badGateway(
      `Prowlarr returned an error (${err.response?.status ?? 'unknown'}).`,
      err.response?.data,
    );
  }
  throw ApiError.internal('Unexpected error while searching Prowlarr');
}

async function searchMovie(title: string, year?: number): Promise<TorrentRelease[]> {
  assertConfigured();

  const query = year ? `${title} ${year}` : title;
  const cacheKey = `prowlarr:search:${query.toLowerCase().trim()}`;
  const cache = getCache();

  const cached = await cache.get<TorrentRelease[]>(cacheKey);
  if (cached) return cached;

  try {
    const client = getClient();
    const { data } = await client.get<ProwlarrSearchResult[]>('/api/v1/search', {
      params: {
        query,
        type: 'search',
        categories: [MOVIES_CATEGORY],
      },
    });

    const releases = data
      .map(mapResult)
      .filter((r): r is TorrentRelease => r !== null)
      .sort((a, b) => b.seeders - a.seeders);

    await cache.set(cacheKey, releases, SEARCH_TTL_SECONDS);
    return releases;
  } catch (err) {
    logger.warn({ err, query }, 'Prowlarr search failed');
    handleProwlarrError(err);
  }
}

export const prowlarrService = {
  isConfigured,
  searchMovie,
};
