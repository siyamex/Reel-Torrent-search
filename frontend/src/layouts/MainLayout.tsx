import { useEffect, useRef } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';

export function MainLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  // Guards against firing the toast twice for the same redirect result —
  // React 18 StrictMode double-invokes effects in development, which would
  // otherwise show this toast twice before the URL cleanup below lands.
  const handledResultRef = useRef<string | null>(null);

  useEffect(() => {
    const seedrResult = searchParams.get('seedr');
    if (!seedrResult) return;

    const message = searchParams.get('message');
    const dedupeKey = `${seedrResult}:${message ?? ''}`;
    if (handledResultRef.current === dedupeKey) return;
    handledResultRef.current = dedupeKey;

    if (seedrResult === 'connected') {
      toast.success('Seedr connected successfully');
      queryClient.invalidateQueries({ queryKey: ['seedr'] });
    } else if (seedrResult === 'error') {
      toast.error(message || 'Failed to connect Seedr');
    }

    const next = new URLSearchParams(searchParams);
    next.delete('seedr');
    next.delete('message');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col bg-base-950">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
