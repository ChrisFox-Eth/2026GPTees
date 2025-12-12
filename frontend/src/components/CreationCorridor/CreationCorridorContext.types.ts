/**
 * @module components/CreationCorridor/CreationCorridorContext/types
 * @description Type definitions for Creation Corridor context and hook.
 * @since 2025-12-12
 */

import type {
  CreationCorridorStage,
  CreationCorridorStartArgs,
  CreationCorridorState,
} from '../../types/creationCorridor';

/**
 * @interface CreationCorridorContextValue
 * @description Public API for the Creation Corridor controller.
 */
export interface CreationCorridorContextValue {
  /** Current corridor state. */
  state: CreationCorridorState;

  /** Ordered list of narrative stages used by the overlay. */
  stages: CreationCorridorStage[];

  /** Whether the overlay UI should be rendered above the app routes. */
  overlayVisible: boolean;

  /** Starts a new corridor run from the beginning. */
  start: (args: CreationCorridorStartArgs) => Promise<void>;

  /** Navigates to the auth page for a guest continuation, keeping corridor state alive. */
  goToAuth: () => void;

  /** Clears corridor state and restores UI/scroll lock to a normal browsing experience. */
  exit: () => void;
}
