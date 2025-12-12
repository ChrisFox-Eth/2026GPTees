/**
 * @module components/ui/Alert
 * @description Type definitions for the Alert component
 * @since 2025-11-21
 */

import type React from 'react';

/**
 * Supported Alert variants corresponding to theme colors
 * @typedef {('primary' | 'secondary' | 'success' | 'warning' | 'danger')} AlertVariant
 */
export type AlertVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

/**
 * Props for the Alert component
 * @interface AlertProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 *
 * @property {React.ReactNode} children - Message or content to display inside the alert
 * @property {AlertVariant} [variant='primary'] - Color style variant (context type)
 * @property {boolean} [isDismissible=false] - Whether the alert can be closed/dismissed by the user
 * @property {() => void} [onDismiss] - Callback when the alert is dismissed (close button clicked)
 * @property {string} [className] - Additional CSS classes for the alert container
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: AlertVariant;
  isDismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}
