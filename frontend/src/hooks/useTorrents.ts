import { useQuery } from '@tanstack/react-query';
import { torrentService } from '@/services/torrentService';

export function useTorrents(title: string | undefined, year: number | undefined) {
  return useQuery({
    queryKey: ['torrents', title, year],
    queryFn: () => torrentService.search(title as string, year),
    enabled: Boolean(title),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
