/**
 * @module pages/SignUpPage
 * @description Sign up page with Clerk authentication
 * @since 2025-11-21
 */

import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/#quickstart"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
          },
        }}
      />
    </div>
  );
}
