/**
 * @module components/MotionHoverCard/MotionHoverCard
 * @description Animated information card that responds to hover and focus states.
 * Uses Framer Motion to create a subtle parallax lift and glow effect.
 *
 * @component
 * @param {MotionHoverCardProps} props - {@link MotionHoverCard.types.ts|MotionHoverCardProps}
 * @returns {JSX.Element} Interactive animated card.
 *
 * @example
 * <MotionHoverCard title="Performance" description="Track KPI changes instantly." />
 */

import { motion } from 'framer-motion';
import type { MotionHoverCardProps } from './MotionHoverCard.types';

export default function MotionHoverCard({
  title,
  description,
  icon,
  className = '',
  ...rest
}: MotionHoverCardProps): JSX.Element {
  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.02 }}
      whileFocus={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={`relative overflow-hidden rounded-xl border border-primary-100 bg-white/80 p-6 shadow-md backdrop-blur dark:border-primary-900/60 dark:bg-gray-800 ${className}`}
      {...rest}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-primary-500/10 dark:from-primary-500/20 dark:to-primary-900/40"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        {icon && <div className="text-primary-600 dark:text-primary-300">{icon}</div>}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
      </div>
    </motion.article>
  );
}
