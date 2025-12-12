/**
 * @module components/motion/MotionHoverCard
 * @description Animated information card that responds to hover and focus states
 * @since 2025-11-21
 */

import { motion } from 'framer-motion';
import type { MotionHoverCardProps } from './MotionHoverCard.types';

/**
 * @component
 * @description Animated information card with hover, focus, and tap interactions.
 * Uses Framer Motion to create a subtle parallax lift effect with gradient background.
 * Includes spring animations for smooth transitions.
 *
 * @param {MotionHoverCardProps} props - Component props
 * @param {string} props.title - Title displayed inside the card
 * @param {string} props.description - Supporting copy rendered below the title
 * @param {React.ReactNode} [props.icon] - Optional icon or element positioned next to the title
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} Interactive animated card
 *
 * @example
 * <MotionHoverCard title="Performance" description="Track KPI changes instantly." />
 */
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
      className={`border-primary-100 dark:border-primary-900/60 relative overflow-hidden rounded-xl border bg-white/80 p-6 shadow-md backdrop-blur dark:bg-gray-800 ${className}`}
      {...rest}
    >
      <div
        className="from-primary-100/40 to-primary-500/10 dark:from-primary-500/20 dark:to-primary-900/40 absolute inset-0 bg-gradient-to-br via-transparent"
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
