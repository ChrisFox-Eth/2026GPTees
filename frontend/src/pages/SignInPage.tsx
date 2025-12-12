/**
 * @module pages/SignInPage
 * @description Sign in page with Clerk authentication
 * @since 2025-11-21
 */

import { SignIn } from '@clerk/clerk-react';

export default function SignInPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/#quickstart"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            headerTitle: 'Sign in or create your free account',
          },
        }}
      />
    </div>
  );
}
