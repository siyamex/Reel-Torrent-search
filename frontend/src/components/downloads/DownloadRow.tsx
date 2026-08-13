import { Trash2 } from 'lucide-react';
import { formatBytes, formatEta, formatSpeed } from '@/utils/format';
import type { SeedrTask, TaskStatus } from '@/types/seedr';

interface DownloadRowProps {
  task: SeedrTask;
  onDeleteRequest: () => void;
}

const STATUS_STYLES: Record<TaskStatus, { label: string; badge: string; bar: string }> = {
  downloading: {
    label: 'Downloading',
    badge: 'bg-accent-500/15 text-accent-300',
    bar: 'bg-accent-500',
  },
  paused: { label: 'Stopped', badge: 'bg-amber-500/15 text-amber-400', bar: 'bg-amber-500' },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-500/15 text-emerald-400',
    bar: 'bg-emerald-500',
  },
  error: { label: 'Error', badge: 'bg-red-500/15 text-red-400', bar: 'bg-red-500' },
  unknown: { label: 'Unknown', badge: 'bg-base-800 text-base-400', bar: 'bg-base-500' },
};

export function DownloadRow({ task, onDeleteRequest }: DownloadRowProps) {
  const style = STATUS_STYLES[task.status];
  const progress = Math.min(100, Math.max(0, task.progress));

  return (
    <div className="rounded-xl border border-base-800 bg-base-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-base-100" title={task.name}>
            {task.name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-400">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.badge}`}>
              {style.label}
            </span>
            <span>{formatBytes(task.sizeBytes)}</span>
            {task.status === 'downloading' && task.speedBytesPerSec ? (
              <span>{formatSpeed(task.speedBytesPerSec)}</span>
            ) : null}
            {task.status === 'downloading' && task.etaSeconds ? (
              <span>ETA {formatEta(task.etaSeconds)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onDeleteRequest}
            title="Delete"
            aria-label="Delete download"
            className="rounded-full p-2 text-base-300 transition-colors hover:bg-accent-500/15 hover:text-accent-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-base-800">
          <div
            className={`h-full rounded-full transition-all ${style.bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right text-xs text-base-400">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
