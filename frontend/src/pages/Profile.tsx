import { useState, type FormEvent } from 'react';
import { HardDrive, Plug, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrentUser } from '@/hooks/useAuth';
import {
  useConnectSeedr,
  useDisconnectSeedr,
  useSeedrQuota,
  useSeedrStatus,
} from '@/hooks/useSeedrAuth';
import { getErrorMessage } from '@/services/apiClient';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatBytes, formatDate } from '@/utils/format';

export function Profile() {
  const { data: user } = useCurrentUser();
  const { data: status, isLoading: statusLoading } = useSeedrStatus();
  const connected = Boolean(status?.connected);
  const { data: quota, isLoading: quotaLoading, isError: quotaError } = useSeedrQuota(connected);
  const disconnect = useDisconnectSeedr();
  const connect = useConnectSeedr();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDisconnect = () => {
    setConfirmOpen(false);
    disconnect.mutate(undefined, {
      onSuccess: () => toast.success('Seedr disconnected'),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const handleConnect = (e: FormEvent) => {
    e.preventDefault();
    connect.mutate(
      { email, password },
      {
        onSuccess: () => {
          setPassword('');
          toast.success('Seedr connected');
        },
      },
    );
  };

  const used = quota?.usedBytes ?? 0;
  const total = quota?.totalBytes ?? 0;
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-screen-sm animate-fade-in px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-6 text-xl font-semibold text-base-100 sm:text-2xl">Profile</h1>

      <section className="mb-6 rounded-xl border border-base-800 bg-base-900/50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-base-800">
            <User className="h-5 w-5 text-base-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-base-100">{user?.username}</p>
            {user && (
              <p className="text-xs text-base-500">Member since {formatDate(user.createdAt)}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-base-800 bg-base-900/50 p-5">
        <h2 className="mb-1 text-sm font-semibold text-base-100">Seedr connection</h2>
        <p className="mb-4 text-xs text-base-500">
          Connect your own Seedr account to send torrents and manage downloads. Your connection is
          private to your account — no other user can see or use it. Your Seedr password is used
          once to sign in and is never stored — only the resulting session token is kept.
        </p>

        {statusLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-base-800" />
        ) : !connected ? (
          <form onSubmit={handleConnect} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="seedr-email"
                className="mb-1.5 block text-xs font-medium text-base-300"
              >
                Seedr email
              </label>
              <input
                id="seedr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
                className="w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none focus:border-accent-500"
              />
            </div>
            <div>
              <label
                htmlFor="seedr-password"
                className="mb-1.5 block text-xs font-medium text-base-300"
              >
                Seedr password
              </label>
              <input
                id="seedr-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                required
                className="w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none focus:border-accent-500"
              />
            </div>

            {connect.isError && (
              <p className="text-sm text-accent-400">{getErrorMessage(connect.error)}</p>
            )}

            <button
              type="submit"
              disabled={connect.isPending}
              className="mt-1 flex items-center justify-center gap-2 self-start rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-400 disabled:opacity-60"
            >
              <Plug className="h-4 w-4" />
              {connect.isPending ? 'Connecting…' : 'Connect Seedr'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Connected
            </div>

            {quotaLoading ? (
              <div className="h-6 animate-pulse rounded bg-base-800" />
            ) : quotaError ? (
              <p className="text-xs text-base-500">Couldn&apos;t load storage quota right now.</p>
            ) : (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-base-400">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5" />
                    Storage
                  </span>
                  <span>
                    {formatBytes(used)} / {formatBytes(total)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={disconnect.isPending}
              className="self-start rounded-full border border-base-700 px-4 py-1.5 text-xs font-medium text-base-300 transition-colors hover:border-accent-500 hover:text-accent-400 disabled:opacity-50"
            >
              Disconnect Seedr
            </button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Disconnect Seedr?"
        description="You'll need to reconnect before you can send torrents or view downloads again."
        confirmLabel="Disconnect"
        danger
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
