/**
 * @module components/ui/Table
 * @description Type definitions for the Table component
 * @since 2025-11-21
 */

import type React from 'react';

/**
 * Default table row shape (string keys with unknown values)
 * @typedef {Record<string, unknown>} TableRow
 */
export type TableRow = Record<string, unknown>;

/**
 * Definition of a table column
 * @interface TableColumn
 *
 * @property {string} accessor - Key in the data objects for this column
 * @property {string} label - Header text for this column
 * @property {(value: Row[keyof Row], row: Row) => React.ReactNode} [render] - Optional custom render function for cell values (optional)
 */
export interface TableColumn<Row extends TableRow = TableRow> {
  accessor: keyof Row & string;
  label: string;
  render?: (value: Row[keyof Row], row: Row) => React.ReactNode;
}

/**
 * Props for the Table component
 * @interface TableProps
 * @extends {React.TableHTMLAttributes<HTMLTableElement>}
 *
 * @property {Array<TableColumn<Row>>} columns - Columns configuration for the table
 * @property {Row[]} data - Array of data objects to display in rows
 * @property {boolean} [striped=false] - Whether to apply striped row background colors
 * @property {boolean} [hoverable=false] - Whether rows highlight on hover
 * @property {boolean} [isBordered=false] - Whether to show borders around the table and cells
 * @property {boolean} [isCompact=false] - Whether to use compact padding in cells
 * @property {string} [caption] - Optional table caption for accessibility/context (optional)
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
