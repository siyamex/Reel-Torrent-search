import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-base-700 border-t-accent-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
