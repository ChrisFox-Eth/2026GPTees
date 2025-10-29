/**
 * @module components/Modal/Modal
 * @description A reusable modal dialog component with backdrop and content area.
 * Renders a centered overlay with an optional header (title and close button), body content, and an optional footer.
 *
 * @component
 * @param {ModalProps} props - {@link Modal.types.ts|ModalProps} for the modal
 * @returns {JSX.Element | null} The modal JSX (or null if not open)
 *
 * @example
 * // Basic modal usage
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Dialog Title" footer={<Button onClick={...}>OK</Button>}>
 *   <p>Modal content goes here.</p>
 * </Modal>
 *
 * @since 2025-10-28
 * @version 1.0.0
 *
 * @features
 * - Overlay backdrop that disables background interaction when open
 * - Centered modal box with three size options (sm, md, lg for different max-widths)
 * - Optional header with title text and a close (×) button
 * - Optional footer section for actions (e.g., OK/Cancel buttons)
 * - Closes when clicking outside the modal content or pressing Escape (calls onClose)
 * - Dark mode support (modal and backdrop adapt to theme)
 *
 * @accessibility
 * - Uses ARIA roles: `role="dialog"` and `aria-modal="true"` on the modal content
 * - If title is provided, it's labeled with `aria-labelledby` for the header
 * - Close button has an aria-label for screen readers ("Close modal")
 * - Focus is not trapped by this component (for simplicity), but pressing Esc will close the modal for accessibility
 *
 * @integration
 * Wrap any content that should appear in a popup/modal. Ensure to conditionally render <Modal> based on state and supply an onClose handler to manage visibility.
 */

import { useEffect, useRef } from 'react';
import { ModalProps } from './Modal.types';

export default function Modal({
  isOpen,
  onClose,
  title,
  footer,
  size = 'md',
  className = '',
  children,
  ...rest
}: ModalProps): JSX.Element | null {
  // Ref for the modal content container (for focusing or other future uses)
  const contentRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key press when open
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Do not render anything if modal is not open
  if (!isOpen) {
    return null;
  }

  // Determine max-width class based on size prop
  const sizeClasses = (() => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'md':
      default:
        return 'max-w-lg';
    }
  })();

  return (
    <div
      className="fixed inset-0 flex-center bg-black bg-opacity-50 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      {...rest}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative w-full ${sizeClasses} max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}
      >
        {/* Header with title and close button */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        {/* If no title but we have onClose, an absolute close button */}
        {!title && onClose && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        {/* Modal content body */}
        <div className="px-4 py-5">{children}</div>
        {/* Footer section if provided */}
        {footer && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
