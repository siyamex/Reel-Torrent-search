import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon, SearchX } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { PosterGrid } from '@/components/PosterGrid';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchMovies } from '@/hooks/useMovies';
import { getErrorMessage } from '@/services/apiClient';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const debouncedQuery = useDebounce(inputValue, 400);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchParams(debouncedQuery ? { q: debouncedQuery } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchMovies(debouncedQuery.trim());

  const movies = useMemo(() => data?.pages.flatMap((p) => p.results) ?? [], [data]);
  const totalResults = data?.pages[0]?.total_results ?? 0;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const showEmpty =
    debouncedQuery.trim().length > 0 && !isLoading && !isError && movies.length === 0;

  return (
    <div className="mx-auto max-w-screen-2xl animate-fade-in px-4 py-8 sm:px-6 lg:px-10">
      <div className="mb-6 max-w-lg">
        <SearchBar value={inputValue} onChange={setInputValue} autoFocus />
        {debouncedQuery.trim() && !isLoading && !isError && (
          <p className="mt-2 text-sm text-base-400">
            {totalResults.toLocaleString()} result{totalResults === 1 ? '' : 's'} for &ldquo;
            {debouncedQuery}&rdquo;
          </p>
        )}
      </div>

      {!debouncedQuery.trim() && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-base-400">
          <SearchIcon className="h-10 w-10" />
          <p>Start typing to search movies by title.</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <SearchX className="h-10 w-10 text-accent-500" />
          <p className="max-w-md text-base-200">{getErrorMessage(error)}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-1 rounded-full bg-base-800 px-4 py-1.5 text-xs font-medium text-base-100 transition-colors hover:bg-base-700"
          >
            Try again
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-base-400">
          <SearchX className="h-10 w-10" />
          <p>No movies found for &ldquo;{debouncedQuery}&rdquo;.</p>
        </div>
      )}

      {debouncedQuery.trim() && !isError && !showEmpty && (
        <>
          <PosterGrid movies={movies} loading={isLoading || (isFetching && movies.length === 0)} />
          <div ref={sentinelRef} className="h-10 w-full" />
          {isFetchingNextPage && (
            <p className="py-6 text-center text-sm text-base-400">Loading more…</p>
          )}
        </>
      )}
    </div>
  );
}
