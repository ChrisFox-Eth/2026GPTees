/**
 * @module components/ui/Tabs
 * @description Type definitions for the Tabs component
 * @since 2025-11-21
 */

import type React from 'react';

/**
 * A single tab item definition
 * @interface TabItem
 *
 * @property {string} label - Display text for the tab
 * @property {React.ReactNode} content - Content to show when this tab is active
 */
export interface TabItem {
  label: string;
  content: React.ReactNode;
}

/**
 * Props for the Tabs component
 * @interface TabsProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 *
 * @property {TabItem[]} items - Array of tabs (label and content for each tab)
 * @property {number} [defaultIndex=0] - Index of the tab to be active initially
 * @property {(index: number) => void} [onTabChange] - Optional callback invoked when the active tab changes (optional)
 * @property {string} [className] - Additional CSS classes for the outer Tabs container
 */
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TabItem[];
  defaultIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
}
