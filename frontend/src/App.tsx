/**
 * @module App
 * @description Root application component for GPTees
 * @since 2025-11-21
 */

import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from '@components/Header/Header';
import { Footer } from '@components/Footer';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { trackEvent, trackPageView } from '@utils/analytics';
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

function ScrollToTop(): JSX.Element | null {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
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
      <ScrollToTop />
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 flex flex-col overflow-x-hidden">
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
            <Route path="/gift" element={<GiftPage />} />
            <Route path="/gift/success" element={<GiftSuccessPage />} />
            {import.meta.env.DEV && <Route path="/admin" element={<AdminPage />} />}
            <Route
              path="/admin/promo"
              element={
                <ProtectedRoute>
                  <AdminPromoPage />
                </ProtectedRoute>
              }
            />
            <Route path="/auth/*" element={<AuthPage />} />
            <Route path="/sign-in/*" element={<AuthPage />} />
            <Route path="/sign-up/*" element={<AuthPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
