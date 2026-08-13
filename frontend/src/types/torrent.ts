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
  /** A real magnet: URI, or a direct http(s) link that resolves to the .torrent file. */
  torrentUrl: string | null;
  isMagnet: boolean;
  infoUrl: string | null;
}

export interface TorrentSearchResponse {
  releases: TorrentRelease[];
  query: string;
}

export type SortColumn =
  'releaseName' | 'sizeBytes' | 'seeders' | 'leechers' | 'indexer' | 'publishDate';
export type SortDirection = 'asc' | 'desc';
