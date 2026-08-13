import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Calendar } from 'lucide-react';
import { useMovieDetails } from '@/hooks/useMovies';
import { backdropUrl, posterUrl, profileUrl } from '@/services/tmdbImage';
import { formatDate, formatRuntime, releaseYear, formatRating } from '@/utils/format';
import { getErrorMessage } from '@/services/apiClient';
import { TorrentSection } from '@/components/torrents/TorrentSection';

export function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading, isError, error, refetch } = useMovieDetails(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-base-700 border-t-accent-500" />
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <p className="max-w-md text-base-200">
          {isError ? getErrorMessage(error) : "This movie couldn't be found."}
        </p>
        <div className="flex items-center gap-3">
          {isError && (
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-base-800 px-4 py-1.5 text-xs font-medium text-base-100 transition-colors hover:bg-base-700"
            >
              Try again
            </button>
          )}
          <Link to="/" className="text-sm font-medium text-accent-400 hover:text-accent-300">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const backdrop = backdropUrl(movie.backdrop_path);
  const poster = posterUrl(movie.poster_path, 'w500');
  const cast = movie.credits?.cast?.slice(0, 12) ?? [];
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');

  return (
    <div className="animate-fade-in pb-20">
      <section className="relative h-[42vh] min-h-[280px] w-full overflow-hidden sm:h-[56vh]">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 bg-base-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-950 via-base-950/60 to-base-950/10" />

        <Link
          to="/"
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-base-950/70 px-3 py-1.5 text-sm text-base-100 backdrop-blur-sm transition-colors hover:bg-base-900 sm:left-6 sm:top-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </section>

      <div className="mx-auto -mt-24 max-w-screen-2xl px-4 sm:-mt-32 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <div className="mx-auto w-40 shrink-0 overflow-hidden rounded-xl shadow-2xl ring-1 ring-base-800 sm:mx-0 sm:w-56">
            {poster ? (
              <img src={poster} alt={movie.title} className="h-full w-full object-cover" />
            ) : (
              <div className="aspect-[2/3] w-full bg-base-850" />
            )}
          </div>

          <div className="flex-1 pt-2 sm:pt-8">
            <h1 className="text-center text-2xl font-extrabold text-white sm:text-left sm:text-4xl">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="mt-1 text-center text-sm italic text-base-400 sm:text-left">
                {movie.tagline}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-base-300 sm:justify-start">
              <span className="flex items-center gap-1.5 font-medium text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                {formatRating(movie.vote_average)}
                <span className="text-base-500">({movie.vote_count.toLocaleString()})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {releaseYear(movie.release_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatRuntime(movie.runtime)}
              </span>
            </div>

            {movie.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-base-700 px-3 py-1 text-xs text-base-300"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-5 max-w-3xl text-center text-sm leading-relaxed text-base-200 sm:text-left sm:text-base">
              {movie.overview || 'No overview available.'}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:max-w-md">
              <div>
                <dt className="text-base-500">Release date</dt>
                <dd className="text-base-200">{formatDate(movie.release_date)}</dd>
              </div>
              {director && (
                <div>
                  <dt className="text-base-500">Director</dt>
                  <dd className="text-base-200">{director.name}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {cast.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-base-100 sm:text-xl">Cast</h2>
            <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
              {cast.map((member) => {
                const photo = profileUrl(member.profile_path);
                return (
                  <div key={member.id} className="w-24 shrink-0 text-center sm:w-28">
                    <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-base-850 sm:h-28 sm:w-28">
                      {photo ? (
                        <img
                          src={photo}
                          alt={member.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-base-500">
                          No photo
                        </div>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs font-medium text-base-100">
                      {member.name}
                    </p>
                    <p className="line-clamp-1 text-xs text-base-500">{member.character}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {movie.production_companies.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-base-100 sm:text-xl">
              Production companies
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              {movie.production_companies.map((company) => (
                <span key={company.id} className="text-sm text-base-400">
                  {company.name}
                </span>
              ))}
            </div>
          </section>
        )}

        <TorrentSection title={movie.title} year={parseYear(movie.release_date)} />
      </div>
    </div>
  );
}

function parseYear(dateStr: string | null | undefined): number | undefined {
  if (!dateStr) return undefined;
  const year = Number(dateStr.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : undefined;
}
