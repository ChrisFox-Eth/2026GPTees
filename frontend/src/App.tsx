/**
 * @module App
 * @description Root application component. Provides main layout, routing setup, and theme management.
 * This component serves as the main entry point for the React application and orchestrates
 * overall application structure, routing (if using React Router), and theme management.
 *
 * @component
 * @returns {JSX.Element} The root application element with routing and theme support
 *
 * @example
 * // Usage in main.tsx
 * import App from './App';
 * ReactDOM.createRoot(document.getElementById('root')).render(<App />);
 *
 * @since 2025-10-20
 * @version 1.0.0
 * @author Template
 *
 * @features
 * - Dark mode theme support via localStorage and Tailwind classes
 * - Main layout structure
 * - Ready for React Router integration
 *
 * @integration
 * This component can be extended to include:
 * - Route definitions for multi-page navigation
 * - Global state providers (Context API)
 * - Theme provider
 *
 * @status Draft
 * @category Pages
 */

import { useState, useEffect } from 'react';
import Header from '@components/Header/Header';
import Hero from '@components/Hero/Hero';
import './App.css';

export default function App(): JSX.Element {
  const [isDark, setIsDark] = useState(false);
  const [, setIsInitialized] = useState(false);

  /**
   * Initialize theme from localStorage or system preference on mount
   */
  useEffect(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    let isDarkTheme = false;

    if (savedTheme) {
      isDarkTheme = savedTheme === 'dark';
    } else {
      // Check system preference if no saved theme
      isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(isDarkTheme);
    applyTheme(isDarkTheme);
    setIsInitialized(true);
  }, []);

  /**
   * Apply theme to document root element
   * @param {boolean} isDarkMode - Whether to apply dark mode
   */
  const applyTheme = (isDarkMode: boolean) => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  /**
   * Toggle between light and dark themes
   * Saves preference to localStorage
   */
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Header isDark={isDark} onToggleTheme={toggleTheme} />
      <main className="container-max py-8">
        <Hero />
      </main>
    </div>
  );
}
