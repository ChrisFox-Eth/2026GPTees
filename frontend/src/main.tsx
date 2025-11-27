/**
 * @module main
 * @description React application entry point for GPTees
 * @since 2025-11-21
 */

import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import { initAnalytics } from '@utils/analytics';
import { loadMetaPixel, loadGA4 } from '@utils/pixels';
import './index.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables');
}

initAnalytics();

if (import.meta.env.PROD) {
  loadMetaPixel(FB_PIXEL_ID);
  loadGA4(GA_MEASUREMENT_ID);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider
    publishableKey={CLERK_PUBLISHABLE_KEY || ''}
    signInFallbackRedirectUrl="/shop"
    signUpFallbackRedirectUrl="/shop"
    signInUrl="/auth"
    signUpUrl="/auth/sign-up"
  >
    <BrowserRouter>
      <App />
      <Analytics />
    </BrowserRouter>
  </ClerkProvider>
);
