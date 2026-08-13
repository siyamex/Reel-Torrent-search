import { Link } from 'react-router-dom';
import { Star, Film } from 'lucide-react';
import { posterUrl } from '@/services/tmdbImage';
import { releaseYear, formatRating } from '@/utils/format';
import type { MovieSummary } from '@/types/movie';

interface MovieCardProps {
  movie: MovieSummary;
}

export function MovieCard({ movie }: MovieCardProps) {
  const poster = posterUrl(movie.poster_path, 'w342');

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group relative block w-full shrink-0 overflow-hidden rounded-lg bg-base-850 outline-none ring-accent-500 transition-transform duration-300 ease-out hover:z-10 hover:scale-105 focus-visible:ring-2"
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-base-800">
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-base-500">
            <Film className="h-10 w-10" />
            <span className="px-2 text-center text-xs">{movie.title}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-950/95 via-base-950/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {movie.vote_average > 0 && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-base-950/80 px-1.5 py-0.5 text-xs font-medium text-amber-400 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current" />
            {formatRating(movie.vote_average)}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-2.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-2 text-sm font-semibold text-white">{movie.title}</p>
          <p className="text-xs text-base-300">{releaseYear(movie.release_date)}</p>
        </div>
      </div>
    </Link>
  );
}
