/**
 * @module components/Table/Table.types
 * @description Type definitions for the Table component and related sub-components
 * @since 2025-10-20
 * @author Template
 */

/**
 * Table column definition
 * @typedef {Object} TableColumn
 * @property {string} key - Unique key for the column
 * @property {string} label - Display label for the column header
 * @property {boolean} [sortable=false] - Whether column is sortable
 * @property {string} [className] - Additional CSS classes for cells
 * @property {(value: any, row: any) => React.ReactNode} [render] - Custom render function
 */
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

/**
 * Props for the Table component
 * @typedef {Object} TableProps
 * @property {any[]} data - Array of row data objects
 * @property {TableColumn[]} columns - Array of column definitions
 * @property {boolean} [isStriped=true] - Whether rows alternate colors
 * @property {boolean} [isHoverable=false] - Whether rows highlight on hover
 * @property {boolean} [isDense=false] - Whether to use compact padding
 * @property {boolean} [isLoading=false] - Whether table is loading
 * @property {React.ReactNode} [emptyState] - Custom empty state component
 * @property {(key: string, direction: 'asc' | 'desc') => void} [onSort] - Sort handler
 * @property {string} [className] - Additional CSS classes
 * @property {React.HTMLAttributes<HTMLTableElement>} - Standard HTML table attributes
 */
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  data: any[];
  columns: TableColumn[];
  isStriped?: boolean;
  isHoverable?: boolean;
  isDense?: boolean;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  className?: string;
}
