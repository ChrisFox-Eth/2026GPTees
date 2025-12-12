/**
 * @module components/CreationCorridor/useCreationCorridor
 * @description Hook for accessing the Creation Corridor controller.
 * @since 2025-12-12
 */

import { useContext } from 'react';
import { CreationCorridorContext } from './CreationCorridorProvider';
import type { CreationCorridorContextValue } from './CreationCorridorContext.types';

/**
 * @function useCreationCorridor
 * @description Returns the Creation Corridor controller context.
 *
 * @returns {CreationCorridorContextValue} The corridor context value.
 */
export function useCreationCorridor(): CreationCorridorContextValue {
  const ctx = useContext(CreationCorridorContext);
  if (!ctx) {
    throw new Error('useCreationCorridor must be used within a CreationCorridorProvider');
  }
  return ctx;
}
