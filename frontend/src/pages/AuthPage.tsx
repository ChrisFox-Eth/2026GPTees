/**
 * @module pages/AuthPage
 * @description Unified authentication page with sign-in and sign-up (mobile optimized)
 * @since 2025-11-24
 */

import { SignIn, SignUp } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

export default function AuthPage(): JSX.Element {
  const location = useLocation();
  const isSignUp = location.pathname.includes('sign-up');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      {isSignUp ? (
        <SignUp
          path="/auth/sign-up"
          routing="path"
          signInUrl="/auth"
          fallbackRedirectUrl="/shop"
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "shadow-xl",
            },
          }}
        />
      ) : (
        <SignIn
          path="/auth"
          routing="path"
          signUpUrl="/auth/sign-up"
          fallbackRedirectUrl="/shop"
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "shadow-xl",
            },
          }}
        />
      )}
    </div>
  );
}
