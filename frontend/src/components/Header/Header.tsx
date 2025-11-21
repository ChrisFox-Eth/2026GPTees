/**
 * @module components/Header/Header
 * @description Application header component with authentication
 * @since 2025-11-21
 */

import { Link } from 'react-router-dom';
import { useUser, useClerk, SignedIn, SignedOut } from '@clerk/clerk-react';
import { HeaderProps } from './Header.types';
import { Button } from '@components/Button';

export default function Header({ isDark, onToggleTheme }: HeaderProps): JSX.Element {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200 border-b border-gray-200 dark:border-gray-700">
      <div className="container-max py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 bg-primary-600 rounded-md flex items-center justify-center text-white font-bold">
            G
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            2026GPTees
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Home
            </Link>
            <Link to="/shop" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Shop
            </Link>
          </nav>

          {/* Authentication */}
          <SignedOut>
            <Link to="/sign-in">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/sign-up">
              <Button variant="primary" size="sm">
                Sign Up
              </Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link to="/account" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Account
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <Button variant="secondary" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </SignedIn>

          {/* Theme Toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleTheme}
            ariaLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </Button>
        </div>
      </div>
    </header>
  );
}
