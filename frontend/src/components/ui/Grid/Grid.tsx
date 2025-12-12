/**
 * @module components/ui/Grid
 * @description A responsive grid container for CSS Grid layouts
 * @since 2025-11-21
 */

/**
 * @component
 * @description A responsive grid container that applies CSS Grid with configurable column counts
 * and gaps at different breakpoints. Simplifies Tailwind CSS grid utilities.
 *
 * @param {GridProps} props - Component props
 * @param {React.ReactNode} props.children - Child elements to display within the grid
 * @param {number} [props.cols=1] - Number of columns for the default layout
 * @param {number} [props.smCols] - Number of columns on small screens (≥640px) (optional)
 * @param {number} [props.mdCols] - Number of columns on medium screens (≥768px) (optional)
 * @param {number} [props.lgCols] - Number of columns on large screens (≥1024px) (optional)
 * @param {number} [props.xlCols] - Number of columns on extra-large screens (≥1280px) (optional)
 * @param {number} [props.gap=0] - Gap size between grid items (Tailwind spacing scale)
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} A div with CSS grid layout
 *
 * @example
 * <Grid cols={1} mdCols={3} gap={4}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 *
 * @see {@link GridProps} for prop definitions
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
