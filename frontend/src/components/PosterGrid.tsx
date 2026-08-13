import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './skeletons/MovieCardSkeleton';
import type { MovieSummary } from '@/types/movie';

interface PosterGridProps {
  movies: MovieSummary[];
  loading?: boolean;
  skeletonCount?: number;
}

export function PosterGrid({ movies, loading = false, skeletonCount = 18 }: PosterGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
      {loading &&
        Array.from({ length: skeletonCount }).map((_, i) => <MovieCardSkeleton key={`sk-${i}`} />)}
    </div>
  );
}
