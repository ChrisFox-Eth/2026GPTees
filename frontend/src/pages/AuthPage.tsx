/**
 * @module pages/AuthPage
 * @description Unified authentication page with sign-in and sign-up (mobile optimized)
 * @since 2025-11-24
 */

import { SignIn, SignUp } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

/**
 * @component
 * @description Unified authentication page supporting both sign-in and sign-up flows with Clerk. Mobile-optimized with redirect handling.
 *
 * @returns {JSX.Element} The rendered authentication page with Clerk components
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/auth" element={<AuthPage />} />
 * <Route path="/auth/sign-up" element={<AuthPage />} />
 */
export default function AuthPage(): JSX.Element {
  const location = useLocation();
  const isSignUp = location.pathname.includes('sign-up');
  const redirectParam = new URLSearchParams(location.search).get('redirect') || '/';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 dark:bg-gray-900">
      {isSignUp ? (
        <SignUp
          path="/auth/sign-up"
          routing="path"
          signInUrl="/auth"
          fallbackRedirectUrl={redirectParam}
          redirectUrl={redirectParam}
          afterSignUpUrl={redirectParam}
          appearance={{
            elements: {
              rootBox: 'w-full max-w-md',
              card: 'shadow-xl',
            },
          }}
        />
      ) : (
        <SignIn
          path="/auth"
          routing="path"
          signUpUrl="/auth/sign-up"
          fallbackRedirectUrl={redirectParam}
          redirectUrl={redirectParam}
          afterSignInUrl={redirectParam}
          appearance={{
            elements: {
              rootBox: 'w-full max-w-md',
              card: 'shadow-xl',
              headerTitle: 'Sign in or create your free account',
            },
          }}
        />
      )}
    </div>
  );
}
