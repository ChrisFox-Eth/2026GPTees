/**
 * @module components/MotionHoverCard/MotionHoverCard.types
 * @description Type definitions for the MotionHoverCard component.
 * @since 2025-10-29
 */

import React from 'react';

/**
 * Props for the MotionHoverCard component.
 */
export interface MotionHoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title displayed inside the card. */
  title: string;
  /** Supporting copy rendered below the title. */
  description: string;
  /** Optional icon or element positioned next to the title. */
  icon?: React.ReactNode;
}
