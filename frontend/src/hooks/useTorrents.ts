import { useQuery } from '@tanstack/react-query';
import { torrentService } from '@/services/torrentService';

export function useTorrents(title: string | undefined, year: number | undefined) {
  return useQuery({
    queryKey: ['torrents', title, year],
    queryFn: () => torrentService.search(title as string, year),
    enabled: Boolean(title),
    staleTime: 1000 * 60 * 5,
    // No auto-retry: a slow/unreachable Prowlarr instance retrying the same
    // long-timeout request just doubles the wait before the user sees an
    // error. The UI already has an explicit "Try again" button for that.
    retry: false,
  });
}
