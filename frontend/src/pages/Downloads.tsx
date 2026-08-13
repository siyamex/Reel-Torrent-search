import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Download as DownloadIcon, Inbox, Plug } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSeedrStatus } from '@/hooks/useSeedrAuth';
import { useDeleteTask, useSeedrTasks } from '@/hooks/useSeedrTasks';
import { getErrorMessage } from '@/services/apiClient';
import { DownloadRow } from '@/components/downloads/DownloadRow';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { SeedrTask } from '@/types/seedr';

function RowSkeleton() {
  return (
    <div className="rounded-xl border border-base-800 bg-base-900/50 p-4">
      <div className="h-4 w-2/3 animate-pulse rounded bg-base-800" />
      <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-base-800" />
    </div>
  );
}

export function Downloads() {
  const { data: status, isLoading: statusLoading } = useSeedrStatus();
  const connected = Boolean(status?.connected);

  const { data: tasks, isLoading, isError, error, refetch, isFetching } = useSeedrTasks(connected);
  const deleteMutation = useDeleteTask();

  const [confirmTarget, setConfirmTarget] = useState<SeedrTask | null>(null);

  const handleConfirmDelete = () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    setConfirmTarget(null);
    deleteMutation.mutate(target.id, {
      onSuccess: () => toast.success(`Deleted "${target.name}"`),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="mx-auto max-w-screen-lg animate-fade-in px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 flex items-center gap-2.5">
        <DownloadIcon className="h-5 w-5 text-accent-500" />
        <h1 className="text-xl font-semibold text-base-100 sm:text-2xl">Downloads</h1>
      </div>

      {statusLoading && (
        <div className="flex flex-col gap-3">
          <RowSkeleton />
          <RowSkeleton />
        </div>
      )}

      {!statusLoading && !connected && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-base-800 bg-base-900/40 py-20 text-center">
          <Plug className="h-9 w-9 text-base-500" />
          <p className="max-w-sm text-sm text-base-300">
            Connect your Seedr account to see and manage your downloads here.
          </p>
          <Link
            to="/profile"
            className="mt-1 rounded-full bg-accent-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-400"
          >
            Connect Seedr
          </Link>
        </div>
      )}

      {connected && isLoading && (
        <div className="flex flex-col gap-3">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      )}

      {connected && isError && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-base-800 bg-base-900/40 py-20 text-center">
          <AlertTriangle className="h-9 w-9 text-accent-500" />
          <p className="max-w-md text-sm text-base-200">{getErrorMessage(error)}</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-1 rounded-full bg-base-800 px-4 py-1.5 text-xs font-medium text-base-100 transition-colors hover:bg-base-700 disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {connected && !isLoading && !isError && tasks && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-base-800 bg-base-900/40 py-20 text-center">
          <Inbox className="h-9 w-9 text-base-500" />
          <p className="text-sm text-base-300">
            No downloads yet. Send a torrent to Seedr from a movie&apos;s page to see it here.
          </p>
        </div>
      )}

      {connected && !isLoading && !isError && tasks && tasks.length > 0 && (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <DownloadRow key={task.id} task={task} onDeleteRequest={() => setConfirmTarget(task)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Delete download?"
        description={
          confirmTarget
            ? `"${confirmTarget.name}" will be removed from Seedr. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
