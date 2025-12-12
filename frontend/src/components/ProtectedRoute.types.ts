/**
 * @module components/ProtectedRoute/types
 * @description Type definitions for ProtectedRoute component
 * @since 2025-11-21
 */

import type { ReactNode } from 'react';

/**
 * Props for the ProtectedRoute component
 * @interface ProtectedRouteProps
 */
export interface ProtectedRouteProps {
  /** Child components to render when user is authenticated */
  children: ReactNode;
}
