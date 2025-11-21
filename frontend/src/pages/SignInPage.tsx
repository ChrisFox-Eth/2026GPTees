/**
 * @module pages/SignInPage
 * @description Sign in page with Clerk authentication
 * @since 2025-11-21
 */

import { SignIn } from '@clerk/clerk-react';

export default function SignInPage(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl="/shop"
      />
    </div>
  );
}
