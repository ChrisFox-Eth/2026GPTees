/**
 * @module components/motion/MotionStaggerList
 * @description Animated list that staggers children into view using Framer Motion variants
 * @since 2025-11-21
 */

import { motion, useReducedMotion } from 'framer-motion';
import type { MotionStaggerListProps } from './MotionStaggerList.types';
import { MOTION_EASING, MOTION_DURATION } from '@utils/motion';

/**
 * @constant
 * @description Container animation variants for the stagger effect
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * @constant
 * @description Individual item animation variants for list items
 */
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.section,
      ease: MOTION_EASING,
    },
  },
};

/**
 * @component
 * @description Animated list that staggers children into view with sequential timing.
 * Uses Framer Motion variants for coordinated animations. Supports optional striped
 * backgrounds for better visual separation.
 *
 * @param {MotionStaggerListProps} props - Component props
 * @param {MotionStaggerListItem[]} props.items - Items to render and animate
 * @param {boolean} [props.striped=false] - Whether to enable alternating background stripes
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} Animated list element
 *
 * @example
 * <MotionStaggerList items={[{ id: '1', label: 'Onboarding' }]} />
 */
export default function MotionStaggerList({
  items,
  striped = false,
  className = '',
  ...rest
}: MotionStaggerListProps): JSX.Element {
  const shouldReduceMotion = useReducedMotion();

  // If reduced motion is preferred, disable stagger and transforms
  const reducedItemVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: MOTION_DURATION.micro } },
      }
    : itemVariants;

  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className={`divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700 ${className}`}
      {...rest}
    >
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          variants={reducedItemVariants}
          className={`px-4 py-3 ${
            striped && index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
          }`}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
          {item.description && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{item.description}</p>
          )}
        </motion.li>
      ))}
    </motion.ul>
  );
}
