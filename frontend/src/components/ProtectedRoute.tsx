/**
 * @module components/ProtectedRoute
 * @description Protected route wrapper that requires authentication
 * @since 2025-11-21
 */

import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import type { ProtectedRouteProps } from './ProtectedRoute.types';

/**
 * @component
 * @description Route wrapper that enforces authentication using Clerk. Shows a loading spinner
 * while authentication state loads, redirects to /auth if user is not signed in, or renders
 * children if authenticated. Can be bypassed in development with VITE_SKIP_AUTH=true.
 *
 * @param {ProtectedRouteProps} props - Component props
 * @param {ReactNode} props.children - Child components to render when authenticated
 *
 * @returns {JSX.Element} Loading spinner, redirect to auth, or protected content
 *
 * @example
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
  const { isLoaded, isSignedIn } = useAuth();

  if (skipAuth) {
    return <>{children}</>;
  }

  // Wait for auth to load
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary-600 h-12 w-12 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
