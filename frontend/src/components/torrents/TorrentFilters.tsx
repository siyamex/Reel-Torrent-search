import { Search } from 'lucide-react';
import type { Resolution } from '@/types/torrent';

const RESOLUTIONS: Resolution[] = ['2160p', '1080p', '720p'];

interface TorrentFiltersProps {
  selectedResolutions: Set<Resolution>;
  onToggleResolution: (resolution: Resolution) => void;
  minSeeders: number;
  onMinSeedersChange: (value: number) => void;
  maxSeeders: number;
  textFilter: string;
  onTextFilterChange: (value: string) => void;
}

export function TorrentFilters({
  selectedResolutions,
  onToggleResolution,
  minSeeders,
  onMinSeedersChange,
  maxSeeders,
  textFilter,
  onTextFilterChange,
}: TorrentFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-base-800 bg-base-900/60 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
      <div className="flex items-center gap-2">
        {RESOLUTIONS.map((res) => {
          const active = selectedResolutions.has(res);
          return (
            <button
              key={res}
              type="button"
              onClick={() => onToggleResolution(res)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-accent-500 bg-accent-500/15 text-accent-300'
                  : 'border-base-700 text-base-300 hover:border-base-600 hover:text-base-100'
              }`}
              aria-pressed={active}
            >
              {res}
            </button>
          );
        })}
      </div>

      <div className="flex min-w-[180px] flex-1 items-center gap-3">
        <label htmlFor="min-seeders" className="shrink-0 text-xs text-base-400">
          Min seeders: <span className="text-base-100">{minSeeders}</span>
        </label>
        <input
          id="min-seeders"
          type="range"
          min={0}
          max={Math.max(maxSeeders, 1)}
          value={minSeeders}
          onChange={(e) => onMinSeedersChange(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-base-700 accent-accent-500"
        />
      </div>

      <div className="relative sm:w-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-base-500" />
        <input
          type="text"
          value={textFilter}
          onChange={(e) => onTextFilterChange(e.target.value)}
          placeholder="Filter release names…"
          className="w-full rounded-full border border-base-700 bg-base-900 py-1.5 pl-8 pr-3 text-xs text-base-100 placeholder-base-500 outline-none focus:border-accent-500"
        />
      </div>
    </div>
  );
}
