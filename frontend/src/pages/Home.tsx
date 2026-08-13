import { Link } from 'react-router-dom';
import { Info, Star } from 'lucide-react';
import { useTrending } from '@/hooks/useMovies';
import { TrendingRow } from '@/components/TrendingRow';
import { backdropUrl } from '@/services/tmdbImage';
import { formatRating, releaseYear } from '@/utils/format';

export function Home() {
  const trendingToday = useTrending('day');
  const trendingWeek = useTrending('week');

  const hero = trendingToday.data?.[0];
  const heroBackdrop = hero ? backdropUrl(hero.backdrop_path) : null;

  return (
    <div className="animate-fade-in pb-16">
      <section className="relative h-[52vh] min-h-[340px] w-full overflow-hidden sm:h-[64vh]">
        {heroBackdrop ? (
          <img
            src={heroBackdrop}
            alt={hero?.title}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-base-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-950 via-base-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-base-950/80 via-transparent to-transparent" />

        {hero && (
          <div className="absolute bottom-8 left-0 max-w-xl px-4 sm:bottom-12 sm:px-6 lg:px-10">
            <h1 className="text-3xl font-extrabold text-white drop-shadow-lg sm:text-5xl">
              {hero.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-base-200">
              <span className="flex items-center gap-1 font-medium text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                {formatRating(hero.vote_average)}
              </span>
              <span>{releaseYear(hero.release_date)}</span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-base-200 sm:text-base">{hero.overview}</p>
            <Link
              to={`/movie/${hero.id}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-base-950 transition-colors hover:bg-white"
            >
              <Info className="h-4 w-4" />
              More info
            </Link>
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-col gap-10">
        <TrendingRow
          title="Trending Today"
          movies={trendingToday.data}
          isLoading={trendingToday.isLoading}
          isError={trendingToday.isError}
          error={trendingToday.error}
        />
        <TrendingRow
          title="Trending This Week"
          movies={trendingWeek.data}
          isLoading={trendingWeek.isLoading}
          isError={trendingWeek.isError}
          error={trendingWeek.error}
        />
      </div>
    </div>
  );
}
