/**
 * @module components/Table/Table
 * @description A responsive table component for displaying structured data.
 * Renders an HTML table with configurable columns, supporting striped rows, hover highlights, compact style, and borders.
 *
 * @component
 * @param {TableProps} props - {@link Table.types.ts|TableProps} for the table
 * @returns {JSX.Element} A styled table element with header and rows
 *
 * @example
 * // Basic usage with columns and data
 * const columns = [
 *   { accessor: 'name', label: 'Name' },
 *   { accessor: 'age', label: 'Age' },
 * ];
 * const data = [
 *   { name: 'Alice', age: 30 },
 *   { name: 'Bob', age: 25 }
 * ];
 * <Table columns={columns} data={data} striped hoverable />
 *
 * @example
 * // Using custom cell rendering for a column
 * const columns = [
 *   { accessor: 'name', label: 'Name' },
 *   { accessor: 'profile', label: 'Profile', render: (val, row) => <a href={val}>View</a> }
 * ];
 * // ...
 * <Table columns={columns} data={data} isBordered isCompact />
 *
 * @since 2025-10-28
 * @version 1.0.0
 *
 * @features
 * - Dynamically generates table header and rows from data and column definitions
 * - Striped rows (alternating background colors) for readability
 * - Hoverable rows (highlight on hover) for better UX on interactive tables
 * - Compact mode with reduced cell padding for dense data display
 * - Optional borders around table and cells for a structured look
 * - Dark mode support for all styles (striping, text, borders)
 *
 * @accessibility
 * - Uses semantic table elements (`<table>, <thead>, <tr>, <th>, <td>`) for screen reader compatibility
 * - Allows an optional `<caption>` to provide context to the table
 * - Ensures sufficient color contrast for text and backgrounds in both light and dark themes
 *
 * @integration
 * Use to display any tabular data (lists, reports, etc.). Customize cell rendering via the `render` function for complex content or links.
 */

import type { ReactNode } from 'react';
import { TableProps, TableColumn, TableRow } from './Table.types';

export default function Table<Row extends TableRow>({
  columns,
  data,
  striped = false,
  hoverable = false,
  isBordered = false,
  isCompact = false,
  caption,
  className = '',
  ...rest
}: TableProps<Row>): JSX.Element {
  /**
   * Determine base table CSS classes (width and text styling)
   */
  const baseClasses = 'w-full text-left text-sm text-gray-700 dark:text-gray-300';

  /**
   * Determine additional classes based on border option
   */
  const borderClasses = isBordered
    ? 'border border-gray-300 dark:border-gray-700 border-collapse'
    : 'border-separate';

  // Compose the full table class string
  const tableClassName = `${baseClasses} ${borderClasses} ${className}`;

  return (
    <table className={tableClassName} {...rest}>
      {caption && (
        <caption className="caption-top mb-2 text-gray-600 dark:text-gray-400 text-sm">
          {caption}
        </caption>
      )}
      <thead className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
        <tr>
          {columns.map((col) => (
            <th
              key={col.accessor}
              scope="col"
              className={`px-4 py-2 font-semibold ${
                isBordered ? 'border border-gray-300 dark:border-gray-700' : ''
              }`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={`
              ${striped ? (rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800') : ''}
              ${hoverable ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''}
            `}
          >
            {columns.map((col: TableColumn<Row>) => {
              const accessor = col.accessor as keyof Row;
              const cellValue = row[accessor];
              const defaultContent = cellValue as ReactNode;
              return (
                <td
                  key={col.accessor}
                  className={`px-4 ${
                    isCompact ? 'py-1.5' : 'py-2'
                  } ${isBordered ? 'border border-gray-300 dark:border-gray-700' : ''}`}
                >
                  {col.render ? col.render(cellValue, row) : defaultContent}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
