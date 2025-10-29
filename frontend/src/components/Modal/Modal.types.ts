/**
 * @module components/Modal/Modal.types
 * @description Type definitions for the Modal component
 * @since 2025-10-28
 */

import type React from 'react';

/**
 * Supported modal size options (controls width of modal content)
 * @typedef {('sm' | 'md' | 'lg')} ModalSize
 */
export type ModalSize = 'sm' | 'md' | 'lg';

/**
 * Props for the Modal component
 * @typedef {Object} ModalProps
 * @property {boolean} isOpen - Whether the modal is open (visible)
 * @property {() => void} [onClose] - Callback when the modal should close (e.g., overlay or close button clicked, or Esc pressed)
 * @property {string} [title] - Optional title text to display in the modal header
 * @property {React.ReactNode} [footer] - Optional footer content (e.g., action buttons)
 * @property {ModalSize} [size='md'] - Size of the modal (controls max-width)
 * @property {string} [className] - Additional CSS classes for the modal content container
 * @property {React.ReactNode} children - Content to display inside the modal
 */
export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  children: React.ReactNode;
}
