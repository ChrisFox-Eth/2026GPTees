/**
 * @module components/Header/Header
 * @description Application header component with authentication
 * @since 2025-11-21
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useClerk, SignedIn, SignedOut } from '@clerk/clerk-react';
import { HeaderProps } from './Header.types';
import { Button } from '@components/Button';
import { useCart } from '../../hooks/useCart';
import GPTeesIconDarkMode from '../../assets/GPTeesIconDarkMode.png';
import GPTeesIconLightMode from '../../assets/GPTeesIconLightMode.png';

export default function Header({ isDark }: HeaderProps): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 w-full bg-white/95 dark:bg-gray-900/90 shadow-sm transition-colors duration-200 border-b border-gray-200 dark:border-gray-700 backdrop-blur">
        <div className="container-max px-4 py-2 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
            <div className="h-7 w-7 rounded-md flex items-center justify-center">
              {isDark ? (
                <img src={GPTeesIconDarkMode} alt="GPTees Logo" />
              ) : (
                <img src={GPTeesIconLightMode} alt="GPTees Logo" />
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">GPTees</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <nav className="flex items-center gap-4">
              <Link
                to="/shop"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Shop
              </Link>
              <Link
                to="/gift"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Gift a GPTee
              </Link>
            </nav>

            <SignedOut>
              <Link to="/auth">
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                to="/account"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hidden lg:block"
              >
                Account
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden lg:inline">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </SignedIn>

            <Link to="/cart" className="relative">
              <Button variant="secondary" size="sm" ariaLabel="Open cart">
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
{/* 
            <Button
              style={{ display: 'none' }}
              variant="secondary"
              size="sm"
              onClick={onToggleTheme}
              ariaLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? 'Light' : 'Dark'}
            </Button> */}
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/cart" className="relative">
              <Button variant="secondary" size="sm" ariaLabel="Open cart" className="px-3 py-1.5 text-sm">
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            <Button
              variant="primary"
              size="sm"
              className="px-3 py-1.5 text-sm"
              onClick={toggleMobileMenu}
              ariaLabel="Toggle menu"
            >
              {isMobileMenuOpen ? 'Close' : 'Menu'}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          <div className="fixed top-[52px] right-0 bottom-0 w-full bg-white dark:bg-gray-800 shadow-lg z-50 md:hidden transform transition-transform duration-300">
            <nav className="flex flex-col h-full p-4 gap-4">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={closeMobileMenu}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Shop
              </Link>
              <Link
                to="/gift"
                onClick={closeMobileMenu}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Gift a GPTee
              </Link>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

              <SignedOut>
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button variant="primary" size="sm" className="w-full">
                    Sign In / Sign Up
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                <Link
                  to="/account"
                  onClick={closeMobileMenu}
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Account
                </Link>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 py-2 px-3">
                    {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                  <Button variant="secondary" size="sm" onClick={handleSignOut} className="w-full">
                    Sign Out
                  </Button>
                </div>
              </SignedIn>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

              {/* <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onToggleTheme();
                  closeMobileMenu();
                }}
                className="w-full"
              >
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </Button> */}

              <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-between">
                </div>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
