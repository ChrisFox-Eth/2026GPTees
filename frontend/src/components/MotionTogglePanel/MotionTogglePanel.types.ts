/**
 * @module components/MotionTogglePanel/MotionTogglePanel.types
 * @description Type definitions for the MotionTogglePanel component.
 * @since 2025-10-29
 */

import React from 'react';

/**
 * Props for the MotionTogglePanel component.
 */
export interface MotionTogglePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Heading text displayed next to the toggle button. */
  title: string;
  /** Panel content rendered when expanded. */
  children: React.ReactNode;
  /** Initial open state for the collapsible panel. */
  defaultOpen?: boolean;
  /** Callback invoked whenever the panel toggles. */
  onToggle?: (isOpen: boolean) => void;
}
