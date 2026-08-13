export interface SeedrTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds */
  expiresAt: number;
}

export interface SeedrTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export interface SeedrErrorResponse {
  error?: string;
  error_description?: string;
}

export interface SeedrQuota {
  usedBytes: number;
  totalBytes: number;
}

export type TaskStatus = 'downloading' | 'paused' | 'completed' | 'error' | 'unknown';

export interface SeedrTask {
  id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  sizeBytes: number | null;
  downloadedBytes: number | null;
  speedBytesPerSec: number | null;
  etaSeconds: number | null;
  folderId: string | null;
}

/**
 * Shape of a single active torrent as returned by Seedr's real
 * `resource.php?func=list_contents` endpoint. Seedr has no official public
 * API docs for this — confirmed by reading the open-source `seedrcc`
 * client, which reverse-engineered it from Seedr's own Kodi add-on and
 * Chrome extension. Kept defensive/optional since this is an unofficial,
 * undocumented API that could change without notice.
 */
export interface SeedrTorrentRaw {
  id?: number | string;
  name?: string;
  size?: number;
  hash?: string;
  /** A numeric percentage, sometimes serialized as a string (e.g. "45.20"). */
  progress?: string | number;
  download_rate?: number;
  upload_rate?: number;
  seeders?: number;
  leechers?: number;
  /** 1 when Seedr itself has stopped the transfer (no user-triggered pause exists in this API). */
  stopped?: number;
  folder?: string;
  warnings?: string | null;
}

export interface SeedrMemoryBandwidthRaw {
  space_used?: number;
  space_max?: number;
  bandwidth_used?: number;
  bandwidth_max?: number;
  is_premium?: number;
}

export interface SeedrAddTorrentResult {
  result?: boolean;
  user_torrent_id?: number;
  title?: string;
  torrent_hash?: string;
  code?: number;
  error?: string;
  error_description?: string;
}
