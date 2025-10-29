/**
 * @module components/MotionFadeIn/MotionFadeIn
 * @description Wrapper component that animates its children into view using Framer Motion.
 * Combines a fade with an optional directional slide for polished entrances.
 *
 * @component
 * @param {MotionFadeInProps} props - {@link MotionFadeIn.types.ts|MotionFadeInProps}
 * @returns {JSX.Element} Animated container around the provided children.
 *
 * @example
 * <MotionFadeIn direction="up" delay={0.2}>
 *   <Card title="Welcome">Content that fades upward.</Card>
 * </MotionFadeIn>
 */

import { motion } from 'framer-motion';
import type { MotionFadeInProps, MotionFadeInDirection } from './MotionFadeIn.types';

/**
 * Map the direction prop to offset values on the x/y axes.
 */
const directionOffset: Record<MotionFadeInDirection, { x: number; y: number }> = {
  none: { x: 0, y: 0 },
  up: { x: 0, y: 16 },
  down: { x: 0, y: -16 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
};

export default function MotionFadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = '',
  ...rest
}: MotionFadeInProps): JSX.Element {
  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay, duration, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
