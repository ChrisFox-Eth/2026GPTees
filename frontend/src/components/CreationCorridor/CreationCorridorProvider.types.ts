/**
 * @module components/CreationCorridor/CreationCorridorProvider/types
 * @description Type definitions for the CreationCorridorProvider component.
 * @since 2025-12-12
 */

import type { ReactNode } from 'react';

/**
 * @interface CreationCorridorProviderProps
 * @description Props for the CreationCorridorProvider component.
 */
export interface CreationCorridorProviderProps {
  /** Child components that will be wrapped by the provider. */
  children: ReactNode;
}
