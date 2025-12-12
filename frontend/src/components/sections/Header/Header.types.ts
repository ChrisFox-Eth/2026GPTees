/**
 * @module components/sections/Header/types
 * @description Type definitions for the Header component
 * @since 2025-11-21
 */

/**
 * Props for the Header component
 * @interface HeaderProps
 * @property {boolean} isDark - Whether dark mode is currently enabled
 * @property {() => void} onToggleTheme - Callback function to toggle between light and dark themes
 */
export interface HeaderProps {
  /** Whether dark mode is currently enabled */
  isDark: boolean;
  /** Callback function to toggle between light and dark themes */
  onToggleTheme: () => void;
}
