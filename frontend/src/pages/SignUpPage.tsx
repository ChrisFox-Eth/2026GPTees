/**
 * @module pages/SignUpPage
 * @description Sign up page with Clerk authentication
 * @since 2025-11-21
 */

import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/#quickstart"
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
          },
        }}
      />
    </div>
  );
}
