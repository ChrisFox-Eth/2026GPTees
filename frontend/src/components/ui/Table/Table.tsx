/**
 * @module components/ui/Table
 * @description A responsive table component for displaying structured data
 * @since 2025-11-21
 */

/**
 * @component
 * @description A flexible table component for displaying structured data with support for striped rows,
 * hover effects, compact mode, borders, and custom cell rendering.
 *
 * @param {TableProps<Row>} props - Component props
 * @param {Array<TableColumn<Row>>} props.columns - Columns configuration for the table
 * @param {Row[]} props.data - Array of data objects to display in rows
 * @param {boolean} [props.striped=false] - Whether to apply striped row background colors
 * @param {boolean} [props.hoverable=false] - Whether rows highlight on hover
 * @param {boolean} [props.isBordered=false] - Whether to show borders around the table and cells
 * @param {boolean} [props.isCompact=false] - Whether to use compact padding in cells
 * @param {string} [props.caption] - Optional table caption for accessibility/context (optional)
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} A styled table element with header and rows
 *
 * @example
 * const columns = [
 *   { accessor: 'name', label: 'Name' },
 *   { accessor: 'age', label: 'Age' },
 * ];
 * const data = [{ name: 'Alice', age: 30 }];
 * <Table columns={columns} data={data} striped hoverable />
 *
 * @see {@link TableProps} for prop definitions
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
        <caption className="mb-2 caption-top text-sm text-gray-600 dark:text-gray-400">
          {caption}
        </caption>
      )}
      <thead className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
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
            className={` ${striped ? (rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800') : ''} ${hoverable ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''} `}
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
