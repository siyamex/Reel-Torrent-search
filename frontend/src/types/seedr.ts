export interface SeedrAuthStatus {
  connected: boolean;
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
