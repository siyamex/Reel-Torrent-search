import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-4xl font-extrabold text-white">404</h1>
      <p className="text-base-400">This page doesn&apos;t exist.</p>
      <Link to="/" className="mt-2 text-sm font-medium text-accent-400 hover:text-accent-300">
        Back to home
      </Link>
    </div>
  );
}
