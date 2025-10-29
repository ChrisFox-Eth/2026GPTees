/**
 * @module components/MotionStaggerList/MotionStaggerList
 * @description Animated list that staggers children into view using Framer Motion variants.
 *
 * @component
 * @param {MotionStaggerListProps} props - {@link MotionStaggerList.types.ts|MotionStaggerListProps}
 * @returns {JSX.Element} Animated list element.
 *
 * @example
 * <MotionStaggerList items={[{ id: '1', label: 'Onboarding' }]} />
 */

import { motion } from 'framer-motion';
import type { MotionStaggerListProps } from './MotionStaggerList.types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 220,
      damping: 24,
    },
  },
};

export default function MotionStaggerList({
  items,
  striped = false,
  className = '',
  ...rest
}: MotionStaggerListProps): JSX.Element {
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
          variants={itemVariants}
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
