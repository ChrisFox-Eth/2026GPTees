/**
 * @module components/MotionFadeIn/MotionFadeIn.types
 * @description Type definitions for the MotionFadeIn component.
 * Provides props for configuring entry direction, delay, and duration.
 * @since 2025-10-29
 */

import type { HTMLMotionProps } from 'framer-motion';

/**
 * Supported entry directions for the fade animation.
 */
export type MotionFadeInDirection = 'up' | 'down' | 'left' | 'right' | 'none';

/**
 * Props for the MotionFadeIn component.
 */
export interface MotionFadeInProps extends HTMLMotionProps<'div'> {
  /** Content to animate into view. */
  children: React.ReactNode;
  /** Direction from which the element should slide while fading. */
  direction?: MotionFadeInDirection;
  /** Delay (in seconds) before the animation starts. */
  delay?: number;
  /** Duration (in seconds) of the fade/slide animation. */
  duration?: number;
}
