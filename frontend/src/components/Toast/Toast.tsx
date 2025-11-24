/**
 * @module components/Toast
 * @description Toast notification component
 * @since 2025-11-24
 */

import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

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
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:bottom-6 md:right-6">
      <div
        className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm flex items-center gap-3`}
      >
        <p className="flex-1 text-sm font-medium">{message}</p>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="text-white font-semibold hover:underline text-sm whitespace-nowrap"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
