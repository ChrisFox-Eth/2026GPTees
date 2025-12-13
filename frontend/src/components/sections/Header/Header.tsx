/**
 * @module components/sections/Header
 * @description Application header component with authentication, navigation, and mobile menu
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders the fixed site header with logo, navigation links, authentication controls,
 * and responsive mobile menu. Integrates with Clerk for user authentication, displays user info when
 * signed in, and provides navigation to Start, Gallery, Gift, and My Designs sections. Updated with
 * semantic tokens for editorial design system.
 *
 * @param {HeaderProps} props - Component props
 * @param {boolean} props.isDark - Current theme state (dark mode enabled)
 * @param {() => void} props.onToggleTheme - Theme toggle callback (currently unused/commented out)
 *
 * @returns {JSX.Element} Fixed header with navigation and mobile menu overlay
 *
 * @example
 * <Header isDark={false} onToggleTheme={() => {}} />
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useClerk, SignedIn, SignedOut } from '@clerk/clerk-react';
import { HeaderProps } from './Header.types';
import { Button } from '@components/ui/Button';
import GPTeesIconDarkMode from '../../../assets/GPTeesIconDarkMode.png';
import GPTeesIconLightMode from '../../../assets/GPTeesIconLightMode.png';

export default function Header({ isDark }: HeaderProps): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

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
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-muted/20 bg-surface/95 shadow-soft backdrop-blur transition-colors duration-200 dark:border-muted-dark/20 dark:bg-surface-dark/90">
        <div className="container-max flex items-center justify-between gap-2 px-4 py-2">
          {/* Logo */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md">
              {isDark ? (
                <img src={GPTeesIconDarkMode} alt="GPTees Logo" />
              ) : (
                <img src={GPTeesIconLightMode} alt="GPTees Logo" />
              )}
            </div>
            <h1 className="font-serif-display tracking-wider text-lg font-bold text-ink sm:text-xl dark:text-ink-dark">GPTees</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-3 md:flex lg:gap-4">
            <nav className="flex items-center gap-4">
              <Link
                to="/#quickstart"
                className="font-sans text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
              >
                Start
              </Link>
              <Link
                to="/#gallery"
                className="font-sans text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
              >
                Gallery
              </Link>
              <Link
                to="/gift"
                className="font-sans text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
              >
                Gift card
              </Link>
            </nav>

            <SignedOut>
              <Link to="/auth">
                <Button variant="primary" size="sm" className="bg-accent text-white hover:opacity-90 dark:bg-accent-dark">
                  Sign In
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                to="/account"
                className="hidden font-sans text-muted transition-colors hover:text-ink lg:block dark:text-muted-dark dark:hover:text-ink-dark"
              >
                My Designs
              </Link>
              <div className="flex items-center gap-2">
                <span className="hidden font-sans text-sm text-muted lg:inline dark:text-muted-dark">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </SignedIn>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="primary"
              size="sm"
              className="bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-accent-dark"
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
            className="fixed inset-0 z-40 bg-ink/50 bg-opacity-50 md:hidden dark:bg-ink-dark/50"
            onClick={closeMobileMenu}
          />
          <div className="fixed top-[52px] right-0 bottom-0 z-50 w-full transform bg-surface shadow-lifted transition-transform duration-300 md:hidden dark:bg-surface-dark">
            <nav className="flex h-full flex-col gap-4 p-4">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="rounded-md px-3 py-2 font-sans text-muted transition-colors hover:bg-surface-2 hover:text-ink dark:text-muted-dark dark:hover:bg-surface-dark dark:hover:text-ink-dark"
              >
                Home
              </Link>
              <Link
                to="/#quickstart"
                onClick={closeMobileMenu}
                className="rounded-md px-3 py-2 font-sans text-muted transition-colors hover:bg-surface-2 hover:text-ink dark:text-muted-dark dark:hover:bg-surface-dark dark:hover:text-ink-dark"
              >
                Start
              </Link>
              <Link
                to="/#gallery"
                onClick={closeMobileMenu}
                className="rounded-md px-3 py-2 font-sans text-muted transition-colors hover:bg-surface-2 hover:text-ink dark:text-muted-dark dark:hover:bg-surface-dark dark:hover:text-ink-dark"
              >
                Gallery
              </Link>
              <Link
                to="/gift"
                onClick={closeMobileMenu}
                className="rounded-md px-3 py-2 font-sans text-muted transition-colors hover:bg-surface-2 hover:text-ink dark:text-muted-dark dark:hover:bg-surface-dark dark:hover:text-ink-dark"
              >
                Gift card
              </Link>

              <div className="my-2 border-t border-muted/20 dark:border-muted-dark/20" />

              <SignedOut>
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button variant="primary" size="sm" className="w-full bg-accent text-white hover:opacity-90 dark:bg-accent-dark">
                    Sign In / Sign Up
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                <Link
                  to="/account"
                  onClick={closeMobileMenu}
                  className="rounded-md px-3 py-2 font-sans text-muted transition-colors hover:bg-surface-2 hover:text-ink dark:text-muted-dark dark:hover:bg-surface-dark dark:hover:text-ink-dark"
                >
                  My Designs
                </Link>
                <div className="flex flex-col gap-2">
                  <span className="px-3 py-2 font-sans text-sm text-muted dark:text-muted-dark">
                    {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                  <Button variant="secondary" size="sm" onClick={handleSignOut} className="w-full">
                    Sign Out
                  </Button>
                </div>
              </SignedIn>

              <div className="my-2 border-t border-muted/20 dark:border-muted-dark/20" />

              <div className="mt-auto border-t border-muted/20 pt-3 font-sans text-xs text-muted dark:border-muted-dark/20 dark:text-muted-dark">
                <div className="flex items-center justify-between"></div>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
