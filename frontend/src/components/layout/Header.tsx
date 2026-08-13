import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clapperboard, Download, Search as SearchIcon } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { QuotaBadge } from '@/components/layout/QuotaBadge';
import { UserMenu } from '@/components/layout/UserMenu';

export function Header() {
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState('');

  const submitSearch = (value: string) => {
    setHeaderQuery(value);
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-base-800/60 bg-base-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-white">
          <Clapperboard className="h-6 w-6 text-accent-500" />
          <span className="text-lg font-bold tracking-tight">Reel</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-base-300 sm:flex">
          <Link to="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <Link to="/search" className="transition-colors hover:text-white">
            Search
          </Link>
          <Link to="/downloads" className="transition-colors hover:text-white">
            Downloads
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden max-w-sm sm:block">
            <SearchBar value={headerQuery} onChange={submitSearch} />
          </div>

          <QuotaBadge />
          <UserMenu />

          <Link
            to="/downloads"
            aria-label="Downloads"
            className="rounded-full p-2 text-base-300 hover:bg-base-850 hover:text-white sm:hidden"
          >
            <Download className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
            className="rounded-full p-2 text-base-300 hover:bg-base-850 hover:text-white sm:hidden"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-base-800/60 px-4 py-3 sm:hidden">
          <SearchBar value={headerQuery} onChange={submitSearch} autoFocus />
        </div>
      )}
    </header>
  );
}
