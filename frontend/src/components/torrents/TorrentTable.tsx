import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBytes, formatShortDate } from '@/utils/format';
import type { SortColumn, SortDirection, TorrentRelease } from '@/types/torrent';

interface TorrentTableProps {
  releases: TorrentRelease[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  seedrConnected: boolean;
  sendingUrl: string | null;
  sentUrls: Set<string>;
  onSend: (release: TorrentRelease) => void;
}

interface ColumnDef {
  key: SortColumn;
  label: string;
  className?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'releaseName', label: 'Release Name', className: 'text-left' },
  { key: 'sizeBytes', label: 'Size', className: 'text-right' },
  { key: 'seeders', label: 'Seeders', className: 'text-right' },
  { key: 'leechers', label: 'Leechers', className: 'text-right' },
  { key: 'indexer', label: 'Indexer', className: 'text-left' },
  { key: 'publishDate', label: 'Published', className: 'text-right' },
];

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-base-600" />;
  return direction === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-accent-400" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-accent-400" />
  );
}

export function TorrentTable({
  releases,
  sortColumn,
  sortDirection,
  onSort,
  seedrConnected,
  sendingUrl,
  sentUrls,
  onSend,
}: TorrentTableProps) {
  const handleCopy = async (release: TorrentRelease) => {
    if (!release.torrentUrl) return;
    try {
      await navigator.clipboard.writeText(release.torrentUrl);
      toast.success(release.isMagnet ? 'Magnet link copied' : 'Download link copied');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-base-800">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-base-800 bg-base-900/60 text-xs uppercase tracking-wide text-base-400">
            {COLUMNS.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${col.className}`}>
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className={`inline-flex items-center gap-1.5 hover:text-base-100 ${
                    col.className === 'text-right' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {col.label}
                  <SortIcon active={sortColumn === col.key} direction={sortDirection} />
                </button>
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {releases.map((release) => (
            <tr
              key={release.guid}
              className="border-b border-base-800/60 last:border-0 hover:bg-base-900/40"
            >
              <td className="max-w-[340px] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base-100" title={release.releaseName}>
                    {release.releaseName}
                  </span>
                  {release.infoUrl && (
                    <a
                      href={release.infoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="shrink-0 text-base-500 hover:text-base-200"
                      aria-label="Open release info"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="mt-1 flex gap-1.5">
                  {release.resolution !== 'Unknown' && (
                    <span className="inline-block rounded bg-base-800 px-1.5 py-0.5 text-[11px] text-base-300">
                      {release.resolution}
                    </span>
                  )}
                  {release.torrentUrl && !release.isMagnet && (
                    <span
                      className="inline-block rounded bg-base-800 px-1.5 py-0.5 text-[11px] text-base-400"
                      title="No magnet link exposed by this indexer — sends via a direct torrent file link instead"
                    >
                      torrent file
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right text-base-300">
                {formatBytes(release.sizeBytes)}
              </td>
              <td className="px-4 py-3 text-right font-medium text-emerald-400">
                {release.seeders}
              </td>
              <td className="px-4 py-3 text-right text-base-400">{release.leechers}</td>
              <td className="px-4 py-3 text-base-300">{release.indexer}</td>
              <td className="px-4 py-3 text-right text-base-400">
                {formatShortDate(release.publishDate)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    disabled={!release.torrentUrl}
                    title={
                      release.torrentUrl
                        ? release.isMagnet
                          ? 'Copy magnet link'
                          : 'Copy download link'
                        : 'No link available for this release'
                    }
                    onClick={() => handleCopy(release)}
                    className="rounded-full p-1.5 text-base-400 transition-colors hover:bg-base-800 hover:text-base-100 disabled:opacity-40"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {(() => {
                    const isSending =
                      release.torrentUrl !== null && sendingUrl === release.torrentUrl;
                    const isSent = release.torrentUrl !== null && sentUrls.has(release.torrentUrl);
                    const disabled = !release.torrentUrl || !seedrConnected || isSending || isSent;

                    const title = !release.torrentUrl
                      ? 'No torrent link available for this release'
                      : !seedrConnected
                        ? 'Connect Seedr in the header to enable sending'
                        : isSent
                          ? 'Already sent to Seedr'
                          : undefined;

                    return (
                      <button
                        type="button"
                        disabled={disabled}
                        title={title}
                        onClick={() => onSend(release)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          isSent
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : disabled
                              ? 'bg-base-800 text-base-400 opacity-60'
                              : 'bg-accent-500 text-white hover:bg-accent-400'
                        }`}
                      >
                        {isSending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isSent ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {isSending ? 'Sending…' : isSent ? 'Sent' : 'Send to Seedr'}
                      </button>
                    );
                  })()}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
