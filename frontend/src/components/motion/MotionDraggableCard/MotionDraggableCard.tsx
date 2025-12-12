/**
 * @module components/motion/MotionDraggableCard
 * @description Draggable card component that uses Framer Motion drag gestures
 * @since 2025-11-21
 */

import { motion, useReducedMotion } from 'framer-motion';
import type { MotionDraggableCardProps } from './MotionDraggableCard.types';
import { MOTION_EASING, MOTION_DURATION } from '@utils/motion';

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
  const shouldReduceMotion = useReducedMotion();
  const fallbackConstraints = { left: -80, right: 80, top: -60, bottom: 60 };
  const dragConstraints = constraintsRef ?? fallbackConstraints;

  // If reduced motion is preferred, disable drag and minimal scale
  const dragEnabled = !shouldReduceMotion;
  const tapAnimation = shouldReduceMotion
    ? {}
    : { scale: 0.98, transition: { duration: MOTION_DURATION.micro, ease: MOTION_EASING } };
  const hoverAnimation = shouldReduceMotion
    ? {}
    : { scale: 1.02, transition: { duration: MOTION_DURATION.micro, ease: MOTION_EASING } };

  return (
    <motion.div
      drag={dragEnabled}
      dragConstraints={dragConstraints}
      whileTap={tapAnimation}
      whileHover={hoverAnimation}
      className={`border-secondary-200 dark:border-secondary-800 w-full max-w-sm ${dragEnabled ? 'cursor-grab active:cursor-grabbing' : ''} rounded-xl border bg-white p-5 shadow-lg dark:bg-gray-900 ${className}`}
      {...rest}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      {children && <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{children}</div>}
    </motion.div>
  );
}
