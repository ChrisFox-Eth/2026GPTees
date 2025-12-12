/**
 * @module components/ui/Modal
 * @description A reusable modal dialog component with backdrop and content area
 * @since 2025-11-21
 */

/**
 * @component
 * @description A modal dialog component with overlay backdrop, optional header, body content, and footer.
 * Supports keyboard navigation (Escape to close) and click-outside-to-close functionality.
 *
 * @param {ModalProps} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open (visible)
 * @param {() => void} [props.onClose] - Callback when the modal should close (optional)
 * @param {string} [props.title] - Optional title text to display in the modal header (optional)
 * @param {React.ReactNode} [props.footer] - Optional footer content (e.g., action buttons) (optional)
 * @param {ModalSize} [props.size='md'] - Size of the modal (sm, md, lg)
 * @param {string} [props.className] - Additional CSS classes for the modal content container
 * @param {React.ReactNode} props.children - Content to display inside the modal
 *
 * @returns {JSX.Element | null} The modal element or null if not open
 *
 * @example
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Dialog Title">
 *   <p>Modal content goes here.</p>
 * </Modal>
 *
 * @see {@link ModalProps} for prop definitions
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
      className="flex-center bg-opacity-50 fixed inset-0 z-50 bg-ink"
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
        className={`relative w-full ${sizeClasses} max-h-[90vh] overflow-y-auto rounded-lg bg-surface shadow-lifted dark:bg-surface-dark ${className}`}
      >
        {/* Header with title and close button */}
        {title && (
          <div className="flex items-center justify-between border-b border-surface-2 px-4 py-3 dark:border-muted-dark">
            <h3 id="modal-title" className="text-lg font-semibold text-ink dark:text-ink-dark">
              {title}
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-muted hover:text-ink focus:outline-none dark:text-muted-dark dark:hover:text-ink-dark"
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
            className="absolute top-3 right-3 text-muted hover:text-ink focus:outline-none dark:text-muted-dark dark:hover:text-ink-dark"
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
          <div className="flex justify-end border-t border-surface-2 px-4 py-3 dark:border-muted-dark">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
