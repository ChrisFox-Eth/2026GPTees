/**
 * @module components/motion/MotionTogglePanel
 * @description Accessible collapsible panel animated with Framer Motion
 * @since 2025-11-21
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MotionTogglePanelProps } from './MotionTogglePanel.types';

/**
 * @component
 * @description Accessible collapsible panel with smooth expand/collapse animations.
 * Uses Framer Motion's AnimatePresence for enter/exit transitions. Includes
 * rotating chevron indicator and proper ARIA attributes.
 *
 * @param {MotionTogglePanelProps} props - Component props
 * @param {string} props.title - Heading text displayed next to the toggle button
 * @param {React.ReactNode} props.children - Panel content rendered when expanded
 * @param {boolean} [props.defaultOpen=false] - Initial open state for the collapsible panel
 * @param {(isOpen: boolean) => void} [props.onToggle] - Callback invoked whenever the panel toggles
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} Animated panel with toggle button
 *
 * @example
 * <MotionTogglePanel title="Changelog">Detailed release notes...</MotionTogglePanel>
 */
export default function MotionTogglePanel({
  title,
  children,
  defaultOpen = false,
  onToggle,
  className = '',
  ...rest
}: MotionTogglePanelProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`}
      {...rest}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="text-gray-500 dark:text-gray-300"
          aria-hidden
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="overflow-hidden border-t border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
