import axios, { isAxiosError } from 'axios';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { getUserStore } from '../store';
import type {
  SeedrAddTorrentResult,
  SeedrErrorResponse,
  SeedrMemoryBandwidthRaw,
  SeedrQuota,
  SeedrTask,
  SeedrTokenResponse,
  SeedrTokens,
  SeedrTorrentRaw,
  TaskStatus,
} from '../types/seedr';

// Seedr has no public developer/API portal for third-party OAuth apps — no
// self-serve client_id/client_secret registration exists. These endpoints
// and the "seedr_chrome" client id were confirmed by reading the
// open-source `seedrcc` client (github.com/hemantapkh/seedrcc), which
// reverse-engineered them from Seedr's own Chrome extension network
// traffic. This is an unofficial, undocumented API and could change
// without notice — "seedr_chrome" is not a secret, it's the public client
// id Seedr's own extension uses.
const TOKEN_URL = 'https://www.seedr.cc/oauth_test/token.php';
const RESOURCE_URL = 'https://www.seedr.cc/oauth_test/resource.php';
const CLIENT_ID = 'seedr_chrome';
// Refresh proactively if the access token is due to expire within this window.
const REFRESH_BUFFER_MS = 60 * 1000;

function getClient() {
  return axios.create({ timeout: 20000 });
}

function handleSeedrError(err: unknown, fallback = 'Seedr request failed'): never {
  if (isAxiosError(err)) {
    const data = err.response?.data as SeedrErrorResponse | undefined;
    if (data?.error_description) throw ApiError.badGateway(data.error_description);
    if (data?.error) throw ApiError.badGateway(data.error);
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      throw ApiError.gatewayTimeout('Seedr took too long to respond.');
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw ApiError.badGateway('Unable to reach Seedr.');
    }
    throw ApiError.badGateway(fallback, err.response?.data);
  }
  throw ApiError.internal(fallback);
}

function toTokens(data: SeedrTokenResponse, fallbackRefreshToken?: string): SeedrTokens {
  const expiresInSeconds = data.expires_in ?? 3600;
  return {
    accessToken: data.access_token,
    // A refresh response doesn't include a new refresh_token — keep reusing the original.
    refreshToken: data.refresh_token ?? fallbackRefreshToken ?? '',
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
}

async function loginWithPassword(email: string, password: string): Promise<SeedrTokens> {
  try {
    const client = getClient();
    const { data } = await client.post<SeedrTokenResponse>(
      TOKEN_URL,
      new URLSearchParams({
        username: email,
        password,
        grant_type: 'password',
        client_id: CLIENT_ID,
        type: 'login',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    if (!data.access_token) {
      throw ApiError.badGateway(
        data.error_description || data.error || 'Seedr rejected that email/password.',
      );
    }
    return toTokens(data);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    handleSeedrError(err, 'Failed to sign in to Seedr. Check your email and password.');
  }
}

async function refreshTokens(refreshToken: string): Promise<SeedrTokens> {
  try {
    const client = getClient();
    const { data } = await client.post<SeedrTokenResponse>(
      TOKEN_URL,
      new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    if (!data.access_token) {
      throw ApiError.badGateway(
        'Failed to refresh the Seedr session. Please reconnect your Seedr account.',
      );
    }
    return toTokens(data, refreshToken);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    handleSeedrError(
      err,
      'Failed to refresh the Seedr session. Please reconnect your Seedr account.',
    );
  }
}

async function connectUser(userId: string, tokens: SeedrTokens): Promise<void> {
  await getUserStore().setSeedrTokens(userId, tokens);
}

async function disconnectUser(userId: string): Promise<void> {
  await getUserStore().clearSeedrTokens(userId);
}

async function isUserConnected(userId: string): Promise<boolean> {
  const user = await getUserStore().getById(userId);
  return Boolean(user?.seedr);
}

async function getAccessToken(userId: string): Promise<string> {
  const user = await getUserStore().getById(userId);
  const seedr = user?.seedr;
  if (!seedr) {
    throw ApiError.unauthorized('Seedr is not connected. Connect your Seedr account first.');
  }

  if (seedr.expiresAt - Date.now() < REFRESH_BUFFER_MS) {
    const refreshed = await refreshTokens(seedr.refreshToken);
    await connectUser(userId, refreshed);
    return refreshed.accessToken;
  }

  return seedr.accessToken;
}

interface ResourceCallOptions {
  method: 'GET' | 'POST';
  func: string;
  data?: Record<string, string>;
  formData?: FormData;
}

async function performResourceCall<T>(opts: ResourceCallOptions, accessToken: string): Promise<T> {
  const client = getClient();
  const { data } = await client.request<T>({
    method: opts.method,
    url: RESOURCE_URL,
    params: { access_token: accessToken, func: opts.func },
    data: opts.formData ?? (opts.data ? new URLSearchParams(opts.data) : undefined),
  });
  return data;
}

/**
 * Makes an authenticated Seedr resource.php call on behalf of a specific
 * user. Refreshes that user's access token proactively if it's near expiry,
 * and — per the "retry once after refresh" requirement — if the call still
 * comes back with an expired/invalid token (Seedr signals this as
 * `{error: "expired_token"}` in an otherwise-200 response, not an HTTP 401),
 * forces a refresh and retries exactly once before giving up.
 */
async function authedResourceCall<T>(userId: string, opts: ResourceCallOptions): Promise<T> {
  const accessToken = await getAccessToken(userId);

  const unwrap = (raw: unknown): T => {
    const obj = raw as { error?: string; error_description?: string } | null;
    if (obj?.error) {
      throw ApiError.badGateway(obj.error_description || obj.error);
    }
    return raw as T;
  };

  try {
    const raw = await performResourceCall<unknown>(opts, accessToken);
    const obj = raw as { error?: string } | null;

    if (obj?.error === 'expired_token' || obj?.error === 'invalid_token') {
      const user = await getUserStore().getById(userId);
      if (user?.seedr) {
        logger.info({ userId }, 'Seedr access token rejected, refreshing and retrying once');
        const refreshed = await refreshTokens(user.seedr.refreshToken);
        await connectUser(userId, refreshed);
        const retryRaw = await performResourceCall<unknown>(opts, refreshed.accessToken);
        return unwrap(retryRaw);
      }
    }

    return unwrap(raw);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    handleSeedrError(err);
  }
}

async function getQuota(userId: string): Promise<SeedrQuota> {
  const data = await authedResourceCall<SeedrMemoryBandwidthRaw>(userId, {
    method: 'GET',
    func: 'get_memory_bandwidth',
  });
  return {
    usedBytes: data.space_used ?? 0,
    totalBytes: data.space_max ?? 0,
  };
}

function parseProgress(value: string | number | undefined): number {
  if (value === undefined) return 0;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function mapTorrent(raw: SeedrTorrentRaw): SeedrTask | null {
  if (raw.id === undefined || raw.id === null) return null;

  const progress = Math.min(100, Math.max(0, parseProgress(raw.progress)));
  const speed = raw.download_rate ?? 0;
  const size = raw.size ?? 0;
  const downloadedBytes = size ? Math.round((size * progress) / 100) : 0;
  const remainingBytes = Math.max(0, size - downloadedBytes);

  let status: TaskStatus = 'downloading';
  if (progress >= 100) status = 'completed';
  else if (raw.stopped === 1) status = 'paused';
  else if (raw.warnings) status = 'error';

  return {
    id: String(raw.id),
    name: raw.name ?? 'Untitled',
    status,
    progress,
    sizeBytes: size || null,
    downloadedBytes: size ? downloadedBytes : null,
    speedBytesPerSec: speed || null,
    etaSeconds: speed > 0 ? Math.round(remainingBytes / speed) : null,
    folderId: raw.folder || null,
  };
}

async function listTasks(userId: string): Promise<SeedrTask[]> {
  const data = await authedResourceCall<{ torrents?: SeedrTorrentRaw[] }>(userId, {
    method: 'POST',
    func: 'list_contents',
    data: { content_type: 'folder', content_id: '0' },
  });

  const raw = data.torrents ?? [];
  return raw.map(mapTorrent).filter((t): t is SeedrTask => t !== null);
}

const REALISTIC_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface ResolvedDownload {
  magnetUrl?: string;
  fileBytes?: ArrayBuffer;
}

/**
 * Resolves a non-magnet download URL (typically Prowlarr's own download
 * proxy) down to either a real magnet link or actual .torrent file bytes.
 *
 * Discovered by testing directly against a live Prowlarr instance: for many
 * indexers, Prowlarr's download endpoint doesn't return a .torrent file at
 * all — it responds with a 301/302 whose `Location` header is itself a
 * `magnet:` URI. A plain redirect-following GET silently breaks on that,
 * since `magnet:` isn't an http(s) scheme axios/Node can follow. So we
 * disable auto-redirects and inspect each hop ourselves, preferring a
 * magnet the moment we see one instead of always chasing down to a file.
 */
async function resolveDownloadUrl(url: string, redirectsLeft = 5): Promise<ResolvedDownload> {
  let response;
  try {
    response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 20000,
      maxRedirects: 0,
      validateStatus: (status) => (status >= 200 && status < 300) || (status >= 300 && status < 400),
      headers: { 'User-Agent': REALISTIC_USER_AGENT },
    });
  } catch (err) {
    if (isAxiosError(err)) {
      if (err.response) {
        throw ApiError.badGateway(
          `Failed to download the torrent file (indexer returned ${err.response.status}). The release may have expired, or this indexer may be blocking automated downloads.`,
        );
      }
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        throw ApiError.gatewayTimeout(
          'Timed out downloading the torrent file. Try again, or pick a different release.',
        );
      }
      throw ApiError.badGateway('Could not reach the indexer to download the torrent file.');
    }
    throw ApiError.internal('Failed to download the torrent file to send to Seedr.');
  }

  if (response.status >= 300 && response.status < 400) {
    const location = (response.headers['location'] as string | undefined)?.trim();
    if (!location) {
      throw ApiError.badGateway('The indexer redirected without a destination.');
    }
    if (location.startsWith('magnet:')) {
      return { magnetUrl: location };
    }
    if (redirectsLeft <= 0) {
      throw ApiError.badGateway('Too many redirects while downloading the torrent file.');
    }
    return resolveDownloadUrl(new URL(location, url).toString(), redirectsLeft - 1);
  }

  return { fileBytes: response.data };
}

/**
 * Adds a torrent to the user's Seedr account. A real `magnet:` URI goes
 * straight through as `torrent_magnet`; anything else (e.g. Prowlarr's own
 * download-proxy link) is resolved via `resolveDownloadUrl` first — that
 * may turn out to be a magnet after all (see above), otherwise the actual
 * .torrent file bytes are uploaded, since Seedr's add_torrent only
 * understands magnets or uploaded torrent files, not arbitrary URLs.
 */
async function createTask(userId: string, torrentUrl: string): Promise<void> {
  let magnetUrl = torrentUrl.startsWith('magnet:') ? torrentUrl : null;
  let fileBytes: ArrayBuffer | null = null;

  if (!magnetUrl) {
    const resolved = await resolveDownloadUrl(torrentUrl);
    magnetUrl = resolved.magnetUrl ?? null;
    fileBytes = resolved.fileBytes ?? null;
  }

  if (magnetUrl) {
    const result = await authedResourceCall<SeedrAddTorrentResult>(userId, {
      method: 'POST',
      func: 'add_torrent',
      data: { folder_id: '0', torrent_magnet: magnetUrl },
    });
    if (result.result === false) {
      throw ApiError.badGateway(result.error_description || 'Seedr rejected this torrent.');
    }
    return;
  }

  if (!fileBytes) {
    throw ApiError.badGateway('Could not resolve a magnet link or torrent file for this release.');
  }

  const formData = new FormData();
  formData.append('folder_id', '0');
  formData.append('torrent_file', new Blob([fileBytes]), 'release.torrent');

  const result = await authedResourceCall<SeedrAddTorrentResult>(userId, {
    method: 'POST',
    func: 'add_torrent',
    formData,
  });
  if (result.result === false) {
    throw ApiError.badGateway(result.error_description || 'Seedr rejected this torrent.');
  }
}

async function deleteTask(userId: string, id: string): Promise<void> {
  const numericId = Number(id);
  await authedResourceCall(userId, {
    method: 'POST',
    func: 'delete',
    data: { delete_arr: JSON.stringify([{ type: 'torrent', id: numericId }]) },
  });
}

async function getFolderContents(userId: string, folderId: string): Promise<unknown> {
  return authedResourceCall(userId, {
    method: 'POST',
    func: 'list_contents',
    data: { content_type: 'folder', content_id: folderId },
  });
}

export const seedrService = {
  loginWithPassword,
  connectUser,
  disconnectUser,
  isUserConnected,
  getQuota,
  listTasks,
  createTask,
  deleteTask,
  getFolderContents,
};
