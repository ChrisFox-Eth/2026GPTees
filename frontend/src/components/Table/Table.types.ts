/**
 * @module components/Table/Table.types
 * @description Type definitions for the Table component
 * @since 2025-10-28
 */

import type React from 'react';

/**
 * Default table row shape (string keys with unknown values)
 */
export type TableRow = Record<string, unknown>;

/**
 * Definition of a table column
 * @typedef {Object} TableColumn
 * @property {string} accessor - Key in the data objects for this column
 * @property {string} label - Header text for this column
 * @property {(value: unknown, row: TableRow) => React.ReactNode} [render] - Optional custom render function for cell values
 */
export interface TableColumn<Row extends TableRow = TableRow> {
  accessor: keyof Row & string;
  label: string;
  render?: (value: Row[keyof Row], row: Row) => React.ReactNode;
}

/**
 * Props for the Table component
 * @typedef {Object} TableProps
 * @property {TableColumn[]} columns - Columns configuration for the table
 * @property {Row[]} data - Array of data objects to display in rows
 * @property {boolean} [striped=false] - Whether to apply striped row background colors
 * @property {boolean} [hoverable=false] - Whether rows highlight on hover
 * @property {boolean} [isBordered=false] - Whether to show borders around the table and cells
 * @property {boolean} [isCompact=false] - Whether to use compact padding in cells
 * @property {string} [caption] - Optional table caption for accessibility/context
 * @property {string} [className] - Additional CSS classes to apply to the table element
 */
export interface TableProps<Row extends TableRow = TableRow>
  extends React.TableHTMLAttributes<HTMLTableElement> {
  columns: Array<TableColumn<Row>>;
  data: Row[];
  striped?: boolean;
  hoverable?: boolean;
  isBordered?: boolean;
  isCompact?: boolean;
  caption?: string;
  className?: string;
}
