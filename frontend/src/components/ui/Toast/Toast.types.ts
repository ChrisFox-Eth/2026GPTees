/**
 * @module components/ui/Toast
 * @description Type definitions for Toast component
 * @since 2025-11-21
 */

/**
 * Action button configuration for Toast
 * @interface ToastAction
 *
 * @property {string} label - Label text for the action button
 * @property {() => void} onClick - Callback when action button is clicked
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Props for the Toast component
 * @interface ToastProps
 *
 * @property {string} message - Message text to display
 * @property {'success' | 'error' | 'info'} [type='success'] - Type of toast notification
 * @property {() => void} onClose - Callback when toast is closed
 * @property {number} [duration=4000] - Auto-dismiss duration in milliseconds
 * @property {ToastAction} [action] - Optional action button configuration (optional)
 */
export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
  action?: ToastAction;
}
