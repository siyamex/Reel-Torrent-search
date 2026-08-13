import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './skeletons/MovieCardSkeleton';
import { getErrorMessage } from '@/services/apiClient';
import type { MovieSummary } from '@/types/movie';

interface TrendingRowProps {
  title: string;
  movies: MovieSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
}

export function TrendingRow({ title, movies, isLoading, isError, error }: TrendingRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="relative">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-6 lg:px-10">
        <h2 className="text-lg font-semibold text-base-100 sm:text-xl">{title}</h2>
        <div className="hidden gap-1 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-600)}
            aria-label={`Scroll ${title} left`}
            className="rounded-full bg-base-850 p-1.5 text-base-300 transition-colors hover:bg-base-800 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(600)}
            aria-label={`Scroll ${title} right`}
            className="rounded-full bg-base-850 p-1.5 text-base-300 transition-colors hover:bg-base-800 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isError ? (
        <p className="px-4 text-sm text-base-400 sm:px-6 lg:px-10">{getErrorMessage(error)}</p>
      ) : (
        <div
          ref={scrollerRef}
          className="scrollbar-thin flex gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 sm:px-6 lg:px-10"
        >
          {isLoading &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={`sk-${i}`} className="w-32 shrink-0 sm:w-40 lg:w-44">
                <MovieCardSkeleton />
              </div>
            ))}

          {!isLoading &&
            movies?.map((movie) => (
              <div key={movie.id} className="w-32 shrink-0 sm:w-40 lg:w-44">
                <MovieCard movie={movie} />
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
