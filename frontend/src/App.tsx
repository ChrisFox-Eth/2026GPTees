/**
 * @module App
 * @description Root application component for 2026GPTees
 * @since 2025-11-21
 */

import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from '@components/Header/Header';
import { Footer } from '@components/Footer';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { trackEvent, trackPageView } from '@utils/analytics';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutPage from './pages/CheckoutPage';
import DesignPage from './pages/DesignPage';
import AccountPage from './pages/AccountPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import RefundsPage from './pages/RefundsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

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

export default function App(): JSX.Element {
  const [isDark, setIsDark] = useState(false);
  const [, setIsInitialized] = useState(false);

  /**
   * Initialize theme from localStorage or system preference on mount
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    let isDarkTheme = false;

    if (savedTheme) {
      isDarkTheme = savedTheme === 'dark';
    } else {
      isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(isDarkTheme);
    applyTheme(isDarkTheme);
    setIsInitialized(true);
  }, []);

  /**
   * Apply theme to document root element
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
   */
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    trackEvent('ui.theme.toggle', { theme: newIsDark ? 'dark' : 'light' });
  };

  return (
    <ErrorBoundary>
      <PageViewTracker />
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 flex flex-col">
        <Header isDark={isDark} onToggleTheme={toggleTheme} />
        <div className="flex-1">
          <Routes>
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
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
