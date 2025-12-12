/**
 * @module components/ui/Grid
 * @description Type definitions for the Grid layout component
 * @since 2025-11-21
 */

import type React from 'react';

/**
 * Props for the Grid component
 * @interface GridProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 *
 * @property {React.ReactNode} children - Child elements to display within the grid
 * @property {number} [cols=1] - Number of columns for the default layout
 * @property {number} [smCols] - Number of columns on small screens (≥640px) (optional)
 * @property {number} [mdCols] - Number of columns on medium screens (≥768px) (optional)
 * @property {number} [lgCols] - Number of columns on large screens (≥1024px) (optional)
 * @property {number} [xlCols] - Number of columns on extra-large screens (≥1280px) (optional)
 * @property {number} [gap=0] - Gap size between grid items (Tailwind spacing scale)
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
