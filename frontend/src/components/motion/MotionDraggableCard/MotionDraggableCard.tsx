/**
 * @module components/motion/MotionDraggableCard
 * @description Draggable card component that uses Framer Motion drag gestures
 * @since 2025-11-21
 */

import { motion } from 'framer-motion';
import type { MotionDraggableCardProps } from './MotionDraggableCard.types';

/**
 * @component
 * @description Draggable card component with spring animations and visual feedback.
 * Uses Framer Motion's drag gestures with customizable constraints. Includes hover
 * and tap scale effects.
 *
 * @param {MotionDraggableCardProps} props - Component props
 * @param {string} props.title - Heading displayed on the draggable card
 * @param {string} [props.subtitle] - Optional supporting subtitle
 * @param {React.ReactNode} [props.children] - Optional additional content rendered below the subtitle
 * @param {React.RefObject<HTMLElement>} [props.constraintsRef] - Optional React ref defining the drag constraints container
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} Draggable animated card
 *
 * @example
 * <MotionDraggableCard title="Drag me" subtitle="Try moving this card" />
 */
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
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`border-secondary-200 dark:border-secondary-800 w-full max-w-sm cursor-grab rounded-xl border bg-white p-5 shadow-lg active:cursor-grabbing dark:bg-gray-900 ${className}`}
      {...rest}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      {children && <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{children}</div>}
    </motion.div>
  );
}
