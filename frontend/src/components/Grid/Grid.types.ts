/**
 * @module components/Grid/Grid.types
 * @description Type definitions for the Grid layout component
 * @since 2025-10-28
 */

import type React from 'react';

/**
 * Props for the Grid component
 * @typedef {Object} GridProps
 * @property {React.ReactNode} children - Child elements to display within the grid
 * @property {number} [cols=1] - Number of columns for the default layout
 * @property {number} [smCols] - Number of columns on small screens (sm breakpoint, ≥640px)
 * @property {number} [mdCols] - Number of columns on medium screens (md breakpoint, ≥768px)
 * @property {number} [lgCols] - Number of columns on large screens (lg breakpoint, ≥1024px)
 * @property {number} [xlCols] - Number of columns on extra-large screens (xl breakpoint, ≥1280px)
 * @property {number} [gap=0] - Gap size between grid items (uses Tailwind spacing scale, e.g., 2 for gap-2)
 * @property {string} [className] - Additional CSS classes for the grid container
 */
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: number;
  smCols?: number;
  mdCols?: number;
  lgCols?: number;
  xlCols?: number;
  gap?: number;
  className?: string;
}
