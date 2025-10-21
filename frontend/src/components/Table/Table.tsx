/**
 * @module components/Table/Table
 * @description A flexible, accessible table component for displaying tabular data.
 * Supports sorting, striping, hover effects, and custom cell rendering.
 *
 * @component
 * @param {TableProps} props - {@link Table.types.ts|TableProps} for the table
 * @returns {JSX.Element} A styled table element
 *
 * @example
 * // Basic table
 * <Table
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'email', label: 'Email' },
 *     { key: 'status', label: 'Status' }
 *   ]}
 *   data={users}
 * />
 *
 * @example
 * // Table with custom rendering and sorting
 * <Table
 *   columns={[
 *     { key: 'name', label: 'Name', sortable: true },
 *     {
 *       key: 'status',
 *       label: 'Status',
 *       render: (value) => <Badge variant={value === 'active' ? 'success' : 'warning'}>{value}</Badge>
 *     },
 *     {
 *       key: 'actions',
 *       label: 'Actions',
 *       render: (_, row) => <Button onClick={() => edit(row.id)}>Edit</Button>
 *     }
 *   ]}
 *   data={items}
 *   isStriped
 *   isHoverable
 *   onSort={(key, direction) => handleSort(key, direction)}
 * />
 *
 * @since 2025-10-20
 * @version 1.0.0
 * @author Template
 *
 * @features
 * - Flexible column definitions with custom rendering
 * - Optional sorting with callbacks
 * - Striped rows for better readability
 * - Hover effects on rows
 * - Dense/compact mode
 * - Loading state
 * - Empty state customization
 * - Dark mode support
 * - Fully accessible with semantic HTML
 *
 * @accessibility
 * - Semantic table structure
 * - Proper header association
 * - Sortable headers with keyboard support
 * - Proper row/column semantics
 *
 * @integration
 * Use for displaying data lists, admin dashboards, and data management interfaces.
 * Combine with pagination and filtering for large datasets.
 *
 * @status Active
 * @category Data Components
 */

import { useState } from 'react';
import { TableProps } from './Table.types';

export default function Table({
  data,
  columns,
  isStriped = true,
  isHoverable = false,
  isDense = false,
  isLoading = false,
  emptyState,
  onSort,
  className = '',
  ...rest
}: TableProps): JSX.Element {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /**
   * Handle column header click for sorting
   */
  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    onSort?.(key, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  /**
   * Get cell content with custom rendering
   */
  const getCellContent = (column: any, row: any) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return value;
  };

  const emptyRows = data.length === 0;
  const paddingClass = isDense ? 'px-4 py-2' : 'px-6 py-4';

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`} {...rest}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 opacity-50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
        </div>
      )}

      <table className="w-full text-left text-sm text-gray-900 dark:text-white">
        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${paddingClass} font-semibold text-gray-700 dark:text-gray-300`}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="inline-flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-1"
                  >
                    {column.label}
                    {sortKey === column.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {emptyRows && !isLoading ? (
            <tr>
              <td colSpan={columns.length} className={`${paddingClass} text-center`}>
                {emptyState || (
                  <div className="py-8 text-gray-500 dark:text-gray-400">
                    <p>No data available</p>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${
                  isStriped && rowIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''
                } ${isHoverable ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${paddingClass} ${column.className || ''}`}
                  >
                    {getCellContent(column, row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
