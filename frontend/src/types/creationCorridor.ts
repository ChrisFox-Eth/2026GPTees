/**
 * @module types/creationCorridor
 * @description Type definitions for the Creation Corridor conversion funnel.
 * @since 2025-12-12
 */

/**
 * @typedef {'IDLE' | 'RUNNING' | 'AUTH_PAUSED' | 'RESUMING' | 'COMPLETING' | 'ERROR'} CreationCorridorPhase
 * @description High-level phase for the Creation Corridor state machine.
 */
export type CreationCorridorPhase =
  | 'IDLE'
  | 'RUNNING'
  | 'AUTH_PAUSED'
  | 'RESUMING'
  | 'COMPLETING'
  | 'ERROR';

/**
 * @interface CreationCorridorStartArgs
 * @description Inputs used to start a new Creation Corridor run.
 *
 * @property {string} prompt - User prompt describing the draft.
 * @property {string} style - Style value forwarded to the design generation endpoint.
 * @property {string} productId - Product ID for preview order creation.
 * @property {string} color - Selected color name.
 * @property {string} size - Selected size.
 * @property {string} tier - Design tier used for the preview order.
 * @property {number} quantity - Quantity for the preview order.
 */
export interface CreationCorridorStartArgs {
  prompt: string;
  style: string;
  productId: string;
  color: string;
  size: string;
  tier: string;
  quantity: number;
}

/**
 * @interface CreationCorridorState
 * @description Runtime state for the Creation Corridor controller.
 *
 * @property {boolean} active - Whether the corridor flow is currently active.
 * @property {CreationCorridorPhase} phase - Current phase of the state machine.
 * @property {number} stageIndex - Current narrative stage index.
 * @property {string} prompt - Persisted prompt for resume across auth.
 * @property {string} style - Persisted style for resume across auth.
 * @property {string | null} orderId - Preview order ID created for this run.
 * @property {string | null} guestToken - Guest token for claim/resume flows.
 * @property {boolean} wasGuest - Whether this run started as a guest flow.
 * @property {boolean} designRequested - Whether a design generation request has been issued.
 * @property {boolean} claimRequested - Whether the claim request has been issued.
 * @property {number | null} startedAtMs - Unix ms timestamp when the run started.
 * @property {string | null} errorMessage - User-safe error message (if any).
 */
export interface CreationCorridorState {
  active: boolean;
  phase: CreationCorridorPhase;
  stageIndex: number;
  prompt: string;
  style: string;
  productId: string | null;
  color: string | null;
  size: string | null;
  tier: string | null;
  quantity: number | null;
  orderId: string | null;
  guestToken: string | null;
  wasGuest: boolean;
  designRequested: boolean;
  claimRequested: boolean;
  startedAtMs: number | null;
  errorMessage: string | null;
}

/**
 * @interface CreationCorridorStage
 * @description Defines UI copy and timing for a Creation Corridor narrative stage.
 *
 * @property {string} key - Stable key for analytics and render keys.
 * @property {string} title - Primary headline copy.
 * @property {string} subtitle - Secondary supporting copy.
 * @property {number} minDurationMs - Minimum time the stage should remain visible.
 * @property {boolean} isAuthPause - Whether this stage can pause for authentication.
 */
export interface CreationCorridorStage {
  key: string;
  title: string;
  subtitle: string;
  minDurationMs: number;
  isAuthPause: boolean;
}

/**
 * @interface PersistedCreationCorridor
 * @description Serialized payload stored in localStorage for corridor resume.
 *
 * @property {number} v - Storage version.
 * @property {number} expiresAtMs - Unix ms timestamp when the payload should be discarded.
 * @property {CreationCorridorState} state - Persisted corridor state.
 */
export interface PersistedCreationCorridor {
  v: number;
  expiresAtMs: number;
  state: CreationCorridorState;
}
