/**
 * @module components/MotionDraggableCard/MotionDraggableCard.types
 * @description Type definitions for the MotionDraggableCard component.
 * @since 2025-10-29
 */

import type React from 'react';
import type { HTMLMotionProps } from 'framer-motion';

/**
 * Props for the MotionDraggableCard component.
 */
export interface MotionDraggableCardProps
  extends Omit<HTMLMotionProps<'div'>, 'dragConstraints' | 'children'> {
  /** Heading displayed on the draggable card. */
  title: string;
  /** Optional supporting subtitle. */
  subtitle?: string;
  /**
   * Optional React ref defining the drag constraints container.
   * When omitted, the card uses a small default drag range.
   */
  constraintsRef?: React.RefObject<Element>;
  /** Optional additional content rendered below the subtitle. */
  children?: React.ReactNode;
}
