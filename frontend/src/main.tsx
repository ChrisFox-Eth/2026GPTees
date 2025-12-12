/**
 * @module main
 * @description React application entry point for GPTees. Initializes the React root,
 * configures Clerk authentication, sets up routing, and loads analytics providers
 * (Vercel Analytics, Meta Pixel, GA4).
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

/**
 * @constant {string | undefined} CLERK_PUBLISHABLE_KEY
 * @description Clerk authentication publishable key from environment variables
 */
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * @constant {string | undefined} FB_PIXEL_ID
 * @description Meta (Facebook) Pixel ID for conversion tracking
 */
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;

/**
 * @constant {string | undefined} GA_MEASUREMENT_ID
 * @description Google Analytics 4 measurement ID for analytics tracking
 */
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Warn if Clerk key is missing (authentication will not work)
if (!CLERK_PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables');
}

// Initialize Vercel Analytics
initAnalytics();

// Load third-party analytics pixels in production only
if (import.meta.env.PROD) {
  loadMetaPixel(FB_PIXEL_ID);
  loadGA4(GA_MEASUREMENT_ID);
}

/**
 * @description Mounts the React application to the DOM root element.
 * Wraps the App component with ClerkProvider for authentication and
 * BrowserRouter for client-side routing. Includes Vercel Analytics component.
 */
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider
    publishableKey={CLERK_PUBLISHABLE_KEY || ''}
    signInFallbackRedirectUrl="/#quickstart"
    signUpFallbackRedirectUrl="/#quickstart"
    signInUrl="/auth"
    signUpUrl="/auth/sign-up"
  >
    <BrowserRouter>
      <App />
      <Analytics />
    </BrowserRouter>
  </ClerkProvider>
);
