/**
 * @module components/Grid/Grid
 * @description A responsive grid container for layout. Applies CSS Grid with specified column counts and gaps at different breakpoints.
 *
 * @component
 * @param {GridProps} props - {@link Grid.types.ts|GridProps} for the grid
 * @returns {JSX.Element} A div that wraps children in a CSS grid layout
 *
 * @example
 * // 3-column grid on desktop, 1-column on mobile, with gap 4
 * <Grid cols={1} mdCols={3} gap={4}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 *
 * @since 2025-10-28
 * @version 1.0.0
 *
 * @features
 * - Simplifies usage of Tailwind CSS grid utilities by accepting numeric props for columns
 * - Responsive: define different column counts for sm, md, lg, xl breakpoints
 * - Customizable gap between items via Tailwind's spacing scale
 * - Inherits full width by default (can be constrained by parent container)
 * - Dark mode support (not specifically needed as it's layout only)
 *
 * @accessibility
 * - Purely a layout component, so it uses a `<div>` with no additional roles. Children should have their own semantics.
 * - Ensures consistent spacing and order for content in all viewports.
 *
 * @integration
 * Use to create grid layouts for galleries, dashboards, lists, etc., without writing repetitive Tailwind classes in each usage.
 */

import { GridProps } from './Grid.types';

export default function Grid({
  children,
  cols = 1,
  smCols,
  mdCols,
  lgCols,
  xlCols,
  gap = 0,
  className = '',
  ...rest
}: GridProps): JSX.Element {
  // Base grid class
  let gridClasses = 'grid';

  // Apply column count for base and breakpoints if provided
  gridClasses += ` grid-cols-${cols}`;
  if (smCols) gridClasses += ` sm:grid-cols-${smCols}`;
  if (mdCols) gridClasses += ` md:grid-cols-${mdCols}`;
  if (lgCols) gridClasses += ` lg:grid-cols-${lgCols}`;
  if (xlCols) gridClasses += ` xl:grid-cols-${xlCols}`;

  // Apply gap if provided (both row and column gap equal)
  if (gap) gridClasses += ` gap-${gap}`;

  return (
    <div className={`${gridClasses} ${className}`} {...rest}>
      {children}
    </div>
  );
}
