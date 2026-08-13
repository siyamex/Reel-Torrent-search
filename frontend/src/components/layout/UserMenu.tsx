import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { getErrorMessage } from '@/services/apiClient';

export function UserMenu() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    setMenuOpen(false);
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-base-700 px-3 py-1.5 text-xs text-base-200 transition-colors hover:border-base-500"
      >
        <User className="h-3.5 w-3.5" />
        <span className="max-w-[8rem] truncate">{user.username}</span>
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-lg border border-base-800 bg-base-900 py-1 shadow-xl">
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-base-200 hover:bg-base-850"
            >
              <UserCircle className="h-3.5 w-3.5" />
              Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-base-200 hover:bg-base-850 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
