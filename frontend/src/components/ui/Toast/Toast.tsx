/**
 * @module components/ui/Toast
 * @description Toast notification component for displaying temporary messages
 * @since 2025-11-21
 */

/**
 * @component
 * @description A toast notification component that displays temporary messages with auto-dismiss functionality.
 * Supports multiple types (success, error, info) and optional action buttons.
 *
 * @param {ToastProps} props - Component props
 * @param {string} props.message - Message text to display
 * @param {'success' | 'error' | 'info'} [props.type='success'] - Type of toast notification
 * @param {() => void} props.onClose - Callback when toast is closed
 * @param {number} [props.duration=4000] - Auto-dismiss duration in milliseconds
 * @param {ToastAction} [props.action] - Optional action button configuration (optional)
 *
 * @returns {JSX.Element} A toast notification element
 *
 * @example
 * <Toast message="Success!" type="success" onClose={() => {}} />
 *
 * @example
 * <Toast
 *   message="Action required"
 *   type="info"
 *   action={{ label: "Undo", onClick: handleUndo }}
 *   onClose={() => {}}
 * />
 *
 * @see {@link ToastProps} for prop definitions
 */

import { useEffect } from 'react';
import type { ToastProps } from './Toast.types';

export type { ToastProps } from './Toast.types';

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 4000,
  action,
}: ToastProps): JSX.Element {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[type];

  return (
    <div className="animate-in slide-in-from-bottom-5 fixed right-4 bottom-4 z-50 md:right-6 md:bottom-6">
      <div
        className={`${bgColor} flex max-w-sm items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg`}
      >
        <p className="flex-1 text-sm font-medium">{message}</p>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="text-sm font-semibold whitespace-nowrap text-white hover:underline"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-white transition-colors hover:text-gray-200"
          aria-label="Close notification"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
