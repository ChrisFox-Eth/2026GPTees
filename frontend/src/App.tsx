/**
 * @module App
 * @description Root application component for GPTees. Configures routing, theme management,
 * error boundaries, scroll behavior, and analytics tracking. Wraps all pages in a consistent
 * layout with Header and Footer.
 * @since 2025-11-21
 */

import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Header, Footer, HolidayPromoBanner } from '@components/sections';
import { CreationCorridorOverlay, useCreationCorridor } from '@components/CreationCorridor';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { trackEvent, trackPageView } from '@utils/analytics';
import { routeTransition } from '@utils/motion';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutPage from './pages/CheckoutPage';
import DesignPage from './pages/DesignPage';
import AccountPage from './pages/AccountPage';
import OrderDetailPage from './pages/OrderDetailPage';
import GiftPage from './pages/GiftPage';
import GiftSuccessPage from './pages/GiftSuccessPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import RefundsPage from './pages/RefundsPage';
import AdminPage from './pages/AdminPage';
import AdminPromoPage from './pages/AdminPromoPage';
import AdminHelpPage from './pages/AdminHelpPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * @function PageViewTracker
 * @description Invisible component that tracks page view analytics on route changes.
 * Fires a page view event whenever the pathname or search query changes.
 * @returns {JSX.Element | null} Returns null (renders nothing)
 */
function PageViewTracker(): JSX.Element | null {
  const location = useLocation();

  useEffect(() => {
    trackPageView({
      path: location.pathname,
      search: location.search || null,
      title: document.title,
      referrer: document.referrer || undefined,
    });
  }, [location.pathname, location.search]);

  return null;
}

/**
 * @function ScrollToTop
 * @description Invisible component that scrolls the window to the top on route changes.
 * Enables smooth scrolling behavior for better UX when navigating between pages.
 * @returns {JSX.Element | null} Returns null (renders nothing)
 */
function ScrollToTop(): JSX.Element | null {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

/**
 * @function ScrollToHash
 * @description Invisible component that scrolls to elements targeted by URL hash fragments.
 * When the URL contains a hash (e.g., /#quickstart), smoothly scrolls to the matching element.
 * @returns {JSX.Element | null} Returns null (renders nothing)
 */
function ScrollToHash(): JSX.Element | null {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  return null;
}

/**
 * @component App
 * @description Root application component. Manages theme state (dark/light mode),
 * configures React Router routes, and provides the application layout structure.
 * All routes are wrapped in an ErrorBoundary with page view tracking.
 *
 * @returns {JSX.Element} The complete application UI with routing
 *
 * @example
 * // Mounted in main.tsx within ClerkProvider and BrowserRouter
 * <App />
 */
export default function App(): JSX.Element {
  /**
   * @function getInitialTheme
   * @description Retrieves initial theme preference from localStorage.
   * Defaults to dark theme if no preference is saved or on server-side.
   * @returns {boolean} True for dark mode, false for light mode
   */
  const getInitialTheme = () => {
    if (typeof window === 'undefined') {
      return true;
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') return true;
    if (savedTheme === 'dark') return false;
    return true; // default to light for first load
  };

  /** @type {boolean} Current dark mode state */
  const [isLight, setIsLight] = useState<boolean>(getInitialTheme);
  /** @type {boolean} Whether theme initialization is complete */
  const [, setIsInitialized] = useState(false);

  /**
   * @description Initialize theme from localStorage with dark as the default for first load.
   * Applies the theme to the document and marks initialization complete.
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkTheme = savedTheme ? savedTheme === 'dark' : true;

    setIsLight(!isDarkTheme);
    applyTheme(isDarkTheme);
    setIsInitialized(true);
  }, []);

  /**
   * @function applyTheme
   * @description Applies the theme to the document root element by adding/removing
   * the 'dark' class on the HTML element for Tailwind CSS dark mode.
   * @param {boolean} isDarkMode - Whether to apply dark mode
   */
  const applyTheme = (isDarkMode: boolean) => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
  };

  /**
   * @function toggleTheme
   * @description Toggles between light and dark themes. Persists the choice to
   * localStorage and tracks the theme change event for analytics.
   */
  const toggleTheme = () => {
    const newIsLight = !isLight;
    setIsLight(newIsLight);
    applyTheme(newIsLight);
    localStorage.setItem('theme', newIsLight ? 'light' : 'dark');
    trackEvent('ui.theme.toggle', { theme: newIsLight ? 'light' : 'dark' });
  };

  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const { state: corridorState } = useCreationCorridor();
  const isCorridorActive = corridorState.active;

  // If reduced motion is preferred, disable route transitions
  const pageTransition = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : routeTransition;

  return (
    <ErrorBoundary>
      <PageViewTracker />
      <ScrollToTop />
      <ScrollToHash />
      <CreationCorridorOverlay />
      <div
        className={`flex min-h-screen flex-col overflow-x-hidden bg-surface transition-colors duration-200 ${
          isCorridorActive ? 'pt-0' : 'pt-8'
        }`}
      >
        {!isCorridorActive && <Header isDark={isLight} onToggleTheme={toggleTheme} />}
        {!isCorridorActive && <HolidayPromoBanner />}
        <div className="bg-paper flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/design" element={<DesignPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/refunds" element={<RefundsPage />} />
                <Route path="/gift" element={<GiftPage />} />
                <Route path="/gift/success" element={<GiftSuccessPage />} />
                {import.meta.env.DEV && (
                  <>
                    <Route path="/admin" element={<AdminPage />} />
                    <Route
                      path="/admin/promo"
                      element={
                        <ProtectedRoute>
                          <AdminPromoPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/help"
                      element={
                        <ProtectedRoute>
                          <AdminHelpPage />
                        </ProtectedRoute>
                      }
                    />
                  </>
                )}
                <Route path="/auth/*" element={<AuthPage />} />
                <Route path="/sign-in/*" element={<AuthPage />} />
                <Route path="/sign-up/*" element={<AuthPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
        {!isCorridorActive && <Footer />}
      </div>
    </ErrorBoundary>
  );
}
