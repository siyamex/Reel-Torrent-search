import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { movieService } from '@/services/movieService';
import type { TrendingWindow } from '@/types/movie';

export function useTrending(window: TrendingWindow) {
  return useQuery({
    queryKey: ['trending', window],
    queryFn: () => movieService.getTrending(window),
    staleTime: 1000 * 60 * 60, // 1h client-side staleness; server already caches 6h
  });
}

export function useSearchMovies(query: string) {
  return useInfiniteQuery({
    queryKey: ['search', query],
    queryFn: ({ pageParam }) => movieService.search(query, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMovieDetails(id: string | number | undefined) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => movieService.getDetails(id as string | number),
    enabled: id !== undefined,
    staleTime: 1000 * 60 * 60,
  });
}
