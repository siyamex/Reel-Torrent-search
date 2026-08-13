import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Clapperboard, LogIn } from 'lucide-react';
import { useCurrentUser, useLogin } from '@/hooks/useAuth';
import { getErrorMessage } from '@/services/apiClient';

export function Login() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const login = useLogin();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!userLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { username, password },
      {
        onSuccess: () => navigate('/', { replace: true }),
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Clapperboard className="h-8 w-8 text-accent-500" />
          <h1 className="text-xl font-bold text-white">Sign in to Reel</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-base-800 bg-base-900/60 p-6"
        >
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-base-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              required
              className="w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none focus:border-accent-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-base-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none focus:border-accent-500"
            />
          </div>

          {login.isError && (
            <p className="text-sm text-accent-400">{getErrorMessage(login.error)}</p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-400 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-base-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-accent-400 hover:text-accent-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
