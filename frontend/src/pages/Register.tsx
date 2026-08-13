import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Clapperboard, UserPlus } from 'lucide-react';
import { useCurrentUser, useRegister } from '@/hooks/useAuth';
import { getErrorMessage } from '@/services/apiClient';

export function Register() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const navigate = useNavigate();
  const register = useRegister();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mismatchError, setMismatchError] = useState(false);

  if (!userLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMismatchError(true);
      return;
    }
    setMismatchError(false);
    register.mutate(
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
          <h1 className="text-xl font-bold text-white">Create your Reel account</h1>
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
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_.\-]+"
              title="Letters, numbers, dots, underscores, or hyphens"
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
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none focus:border-accent-500"
            />
            <p className="mt-1 text-xs text-base-500">At least 8 characters.</p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 block text-xs font-medium text-base-300"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-sm text-base-100 outline-none focus:border-accent-500"
            />
          </div>

          {mismatchError && <p className="text-sm text-accent-400">Passwords don&apos;t match.</p>}
          {register.isError && (
            <p className="text-sm text-accent-400">{getErrorMessage(register.error)}</p>
          )}

          <button
            type="submit"
            disabled={register.isPending}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-400 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {register.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-base-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-400 hover:text-accent-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
