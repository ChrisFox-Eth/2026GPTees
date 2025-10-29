/**
 * @module components/MotionDraggableCard/MotionDraggableCard
 * @description Draggable card component that uses Framer Motion drag gestures.
 *
 * @component
 * @param {MotionDraggableCardProps} props - {@link MotionDraggableCard.types.ts|MotionDraggableCardProps}
 * @returns {JSX.Element} Draggable animated card.
 *
 * @example
 * <MotionDraggableCard title="Drag me" subtitle="Try moving this card" />
 */

import { motion } from 'framer-motion';
import type { MotionDraggableCardProps } from './MotionDraggableCard.types';

export default function MotionDraggableCard({
  title,
  subtitle,
  constraintsRef,
  children,
  className = '',
  ...rest
}: MotionDraggableCardProps): JSX.Element {
  const fallbackConstraints = { left: -80, right: 80, top: -60, bottom: 60 };
  const dragConstraints = constraintsRef ?? fallbackConstraints;

  return (
    <motion.div
      drag
      dragConstraints={dragConstraints}
  return (
    <motion.div
      drag
      dragConstraints={constraintsRef?.current ?? { left: -80, right: 80, top: -60, bottom: 60 }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`w-full max-w-sm cursor-grab rounded-xl border border-secondary-200 bg-white p-5 shadow-lg active:cursor-grabbing dark:border-secondary-800 dark:bg-gray-900 ${className}`}
      {...rest}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      {children && <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{children}</div>}
    </motion.div>
  );
}
