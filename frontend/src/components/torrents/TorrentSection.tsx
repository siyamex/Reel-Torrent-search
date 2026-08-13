import { useMemo, useState } from 'react';
import { AlertTriangle, Clapperboard, SearchX } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTorrents } from '@/hooks/useTorrents';
import { useSeedrStatus } from '@/hooks/useSeedrAuth';
import { useSendToSeedr } from '@/hooks/useSeedrTasks';
import { getErrorMessage } from '@/services/apiClient';
import { TorrentFilters } from './TorrentFilters';
import { TorrentTable } from './TorrentTable';
import type { Resolution, SortColumn, SortDirection, TorrentRelease } from '@/types/torrent';

interface TorrentSectionProps {
  title: string;
  year: number | undefined;
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-base-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-base-800/60 px-4 py-3.5 last:border-0"
        >
          <div className="h-4 flex-1 animate-pulse rounded bg-base-800" />
          <div className="h-4 w-16 animate-pulse rounded bg-base-800" />
          <div className="h-4 w-12 animate-pulse rounded bg-base-800" />
          <div className="h-4 w-20 animate-pulse rounded bg-base-800" />
          <div className="h-4 w-24 animate-pulse rounded bg-base-800" />
        </div>
      ))}
    </div>
  );
}

export function TorrentSection({ title, year }: TorrentSectionProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useTorrents(title, year);
  const { data: seedrStatus } = useSeedrStatus();
  const seedrConnected = Boolean(seedrStatus?.connected);
  const sendMutation = useSendToSeedr();

  const [selectedResolutions, setSelectedResolutions] = useState<Set<Resolution>>(new Set());
  const [minSeeders, setMinSeeders] = useState(0);
  const [textFilter, setTextFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('seeders');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [sentUrls, setSentUrls] = useState<Set<string>>(new Set());

  const releases = useMemo(() => data?.releases ?? [], [data]);
  const maxSeeders = useMemo(
    () => releases.reduce((max, r) => Math.max(max, r.seeders), 0),
    [releases],
  );

  const filteredSorted = useMemo(() => {
    let result = releases;

    if (selectedResolutions.size > 0) {
      result = result.filter((r) => selectedResolutions.has(r.resolution));
    }
    if (minSeeders > 0) {
      result = result.filter((r) => r.seeders >= minSeeders);
    }
    if (textFilter.trim()) {
      const needle = textFilter.trim().toLowerCase();
      result = result.filter((r) => r.releaseName.toLowerCase().includes(needle));
    }

    const sorted = [...result].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      let cmp: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [releases, selectedResolutions, minSeeders, textFilter, sortColumn, sortDirection]);

  const toggleResolution = (resolution: Resolution) => {
    setSelectedResolutions((prev) => {
      const next = new Set(prev);
      if (next.has(resolution)) next.delete(resolution);
      else next.add(resolution);
      return next;
    });
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleSend = (release: TorrentRelease) => {
    if (!release.torrentUrl) return;
    const torrentUrl = release.torrentUrl;

    sendMutation.mutate(torrentUrl, {
      onSuccess: () => {
        setSentUrls((prev) => new Set(prev).add(torrentUrl));
        toast.success(`Sent "${release.releaseName}" to Seedr`);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-base-100 sm:text-xl">Torrent Availability</h2>
        {!isLoading && !isError && releases.length > 0 && (
          <span className="text-xs text-base-500">
            {filteredSorted.length} of {releases.length} release
            {releases.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {isLoading && <TableSkeleton />}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-base-800 bg-base-900/40 py-16 text-center">
          <AlertTriangle className="h-9 w-9 text-accent-500" />
          <p className="max-w-md text-sm text-base-200">{getErrorMessage(error)}</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-1 rounded-full bg-base-800 px-4 py-1.5 text-xs font-medium text-base-100 transition-colors hover:bg-base-700 disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && releases.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-base-800 bg-base-900/40 py-16 text-center">
          <Clapperboard className="h-9 w-9 text-base-500" />
          <p className="max-w-md text-sm text-base-300">
            No torrent releases were found for &ldquo;{title}
            {year ? ` (${year})` : ''}&rdquo; on your configured indexers.
          </p>
        </div>
      )}

      {!isLoading && !isError && releases.length > 0 && (
        <div className="flex flex-col gap-4">
          <TorrentFilters
            selectedResolutions={selectedResolutions}
            onToggleResolution={toggleResolution}
            minSeeders={minSeeders}
            onMinSeedersChange={setMinSeeders}
            maxSeeders={maxSeeders}
            textFilter={textFilter}
            onTextFilterChange={setTextFilter}
          />

          {filteredSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-base-800 bg-base-900/40 py-16 text-center">
              <SearchX className="h-9 w-9 text-base-500" />
              <p className="text-sm text-base-300">No releases match the current filters.</p>
            </div>
          ) : (
            <TorrentTable
              releases={filteredSorted}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              seedrConnected={seedrConnected}
              sendingUrl={sendMutation.isPending ? (sendMutation.variables ?? null) : null}
              sentUrls={sentUrls}
              onSend={handleSend}
            />
          )}
        </div>
      )}
    </section>
  );
}
