/**
 * @module pages/AuthPage
 * @description Unified authentication page with sign-in and sign-up (mobile optimized)
 * @since 2025-11-24
 */

import { SignIn, SignUp } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { useCreationCorridor } from '@components/CreationCorridor';

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

  const { state: corridorState } = useCreationCorridor();
  const isCorridorActive = corridorState.active;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-8 sm:px-6 sm:py-12 lg:px-8 dark:bg-surface-dark">
      <div className="w-full max-w-md space-y-4">
        {isCorridorActive && (
          <div className="rounded-xl border border-muted/20 bg-surface-2 p-4 shadow-soft dark:border-muted-dark/20 dark:bg-surface-dark">
            <p className="font-sans text-sm font-semibold text-ink dark:text-ink-dark">
              We’re holding your draft while you sign in.
            </p>
            <p className="mt-1 font-sans text-xs text-muted dark:text-muted-dark">
              When you’re done, we’ll bring you straight back into the studio.
            </p>
          </div>
        )}

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
    </div>
  );
}
