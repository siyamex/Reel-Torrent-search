import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HardDrive, LogOut, Plug } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDisconnectSeedr, useSeedrQuota, useSeedrStatus } from '@/hooks/useSeedrAuth';
import { getErrorMessage } from '@/services/apiClient';
import { formatBytes } from '@/utils/format';

export function QuotaBadge() {
  const { data: status, isLoading: statusLoading } = useSeedrStatus();
  const connected = Boolean(status?.connected);
  const { data: quota } = useSeedrQuota(connected);
  const disconnect = useDisconnectSeedr();
  const [menuOpen, setMenuOpen] = useState(false);

  if (statusLoading) {
    return <div className="h-8 w-24 animate-pulse rounded-full bg-base-850" />;
  }

  if (!connected) {
    return (
      <Link
        to="/profile"
        className="flex items-center gap-1.5 rounded-full border border-base-700 px-3 py-1.5 text-xs font-medium text-base-200 transition-colors hover:border-accent-500 hover:text-white"
      >
        <Plug className="h-3.5 w-3.5" />
        Connect Seedr
      </Link>
    );
  }

  const used = quota?.usedBytes ?? 0;
  const total = quota?.totalBytes ?? 0;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  const handleDisconnect = () => {
    setMenuOpen(false);
    disconnect.mutate(undefined, {
      onSuccess: () => toast.success('Seedr disconnected'),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-base-700 px-3 py-1.5 text-xs text-base-200 transition-colors hover:border-base-500"
      >
        <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
        <span className="hidden sm:inline">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-base-800">
          <span
            className="block h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </span>
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-lg border border-base-800 bg-base-900 py-1 shadow-xl">
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnect.isPending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-base-200 hover:bg-base-850 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect Seedr
            </button>
          </div>
        </>
      )}
    </div>
  );
}
