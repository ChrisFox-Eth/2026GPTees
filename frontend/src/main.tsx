/**
 * @module main
 * @description React application entry point for 2026GPTees
 * @since 2025-11-21
 */

import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initAnalytics } from '@utils/analytics';
import './index.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables');
}

initAnalytics();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider
    publishableKey={CLERK_PUBLISHABLE_KEY || ''}
    signInFallbackRedirectUrl="/shop"
    signUpFallbackRedirectUrl="/shop"
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>
);
