/**
 * @module components/motion/MotionFadeIn
 * @description Wrapper component that animates its children into view using Framer Motion
 * @since 2025-11-21
 */

import { motion, useReducedMotion } from 'framer-motion';
import type { MotionFadeInProps, MotionFadeInDirection } from './MotionFadeIn.types';
import { MOTION_EASING, MOTION_DURATION } from '@utils/motion';

/**
 * @constant
 * @description Map the direction prop to offset values on the x/y axes
 */
const directionOffset: Record<MotionFadeInDirection, { x: number; y: number }> = {
  none: { x: 0, y: 0 },
  up: { x: 0, y: 16 },
  down: { x: 0, y: -16 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
};

/**
 * @component
 * @description Wrapper component that animates its children into view. Combines a fade
 * with an optional directional slide for polished entrance animations. Uses viewport
 * detection to trigger animations when scrolled into view.
 *
 * @param {MotionFadeInProps} props - Component props
 * @param {React.ReactNode} props.children - Content to animate into view
 * @param {MotionFadeInDirection} [props.direction='up'] - Direction from which the element should slide while fading
 * @param {number} [props.delay=0] - Delay in seconds before the animation starts
 * @param {number} [props.duration=0.6] - Duration in seconds of the fade/slide animation
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} Animated container around the provided children
 *
 * @example
 * <MotionFadeIn direction="up" delay={0.2}>
 *   <Card title="Welcome">Content that fades upward.</Card>
 * </MotionFadeIn>
 */
export default function MotionFadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = '',
  ...rest
}: MotionFadeInProps): JSX.Element {
  const shouldReduceMotion = useReducedMotion();
  const offset = directionOffset[direction];

  // If reduced motion is preferred, use minimal transforms and shorter duration
  const reducedOffset = shouldReduceMotion ? { x: 0, y: 0 } : offset;
  const reducedDuration = shouldReduceMotion ? MOTION_DURATION.micro : duration;

  return (
    <motion.div
      initial={{ opacity: 0, x: reducedOffset.x, y: reducedOffset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay, duration: reducedDuration, ease: MOTION_EASING }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
