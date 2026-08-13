/**
 * Shape of a single result from Prowlarr's aggregate search API
 * (`GET /api/v1/search`). This endpoint fans a query out to every enabled
 * indexer over Torznab under the hood and merges the results, which is far
 * more robust than talking to each indexer's raw Torznab XML endpoint
 * directly (a single flaky indexer can't break the whole search).
 *
 * Field presence varies by indexer, so every field below is treated as
 * optional/untrusted when mapped in prowlarrService.
 */
export interface ProwlarrSearchResult {
  guid?: string;
  title?: string;
  indexer?: string;
  indexerId?: number;
  size?: number;
  seeders?: number;
  leechers?: number;
  grabs?: number;
  publishDate?: string;
  downloadUrl?: string;
  magnetUrl?: string;
  infoUrl?: string;
  protocol?: string;
  categories?: { id: number; name: string }[];
}

export type Resolution = '2160p' | '1080p' | '720p' | '480p' | 'Unknown';

export interface TorrentRelease {
  guid: string;
  releaseName: string;
  resolution: Resolution;
  sizeBytes: number;
  seeders: number;
  leechers: number;
  indexer: string;
  publishDate: string | null;
  /**
   * The best link we have for sending this release to Seedr — a real
   * `magnet:` URI when the indexer exposes one, otherwise a direct http(s)
   * URL (often Prowlarr's own download-proxy link) that resolves to the
   * .torrent file. Both forms work with Seedr's `POST /tasks`. `null` only
   * when neither is available.
   */
  torrentUrl: string | null;
  /** True when torrentUrl is a real magnet: URI rather than an http(s) link. */
  isMagnet: boolean;
  infoUrl: string | null;
}
