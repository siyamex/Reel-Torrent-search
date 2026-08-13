import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from '@/layouts/MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })));
const Search = lazy(() => import('@/pages/Search').then((m) => ({ default: m.Search })));
const MovieDetail = lazy(() =>
  import('@/pages/MovieDetail').then((m) => ({ default: m.MovieDetail })),
);
const Downloads = lazy(() => import('@/pages/Downloads').then((m) => ({ default: m.Downloads })));
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })));
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })));
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

function PageFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-base-700 border-t-accent-500" />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#181c25',
            color: '#e6e8ed',
            border: '1px solid #242833',
          },
          success: { iconTheme: { primary: '#e50914', secondary: '#e6e8ed' } },
        }}
      />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="movie/:id" element={<MovieDetail />} />
              <Route path="downloads" element={<Downloads />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
