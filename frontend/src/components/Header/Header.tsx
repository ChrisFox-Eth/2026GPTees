/**
 * @module components/Header/Header
 * @description Application header component with theme toggle
 * @component
 * @param {HeaderProps} props - Header component props
 * @returns {JSX.Element} Rendered header
 * @example
 * <Header isDark={isDark} onToggleTheme={toggleTheme} />
 * @since 2025-10-20
 * @author Template
 */

import { HeaderProps } from './Header.types';
import { Button } from '@components/Button';

export default function Header({ isDark, onToggleTheme }: HeaderProps): JSX.Element {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200 border-b border-gray-200 dark:border-gray-700">
      <div className="container-max py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary-600 rounded-md" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            React Template
          </h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleTheme}
          ariaLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </Button>
      </div>
    </header>
  );
}
