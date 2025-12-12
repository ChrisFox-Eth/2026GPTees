/**
 * @module components/ErrorBoundary/types
 * @description Type definitions for ErrorBoundary component
 * @since 2025-11-21
 */

import type { ReactNode } from 'react';

/**
 * Props for the ErrorBoundary component
 * @interface ErrorBoundaryProps
 */
export interface ErrorBoundaryProps {
  /** Child components to be wrapped by the error boundary */
  children: ReactNode;
}

/**
 * State for the ErrorBoundary component
 * @interface ErrorBoundaryState
 */
export interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error object, or null if no error */
  error: Error | null;
}
