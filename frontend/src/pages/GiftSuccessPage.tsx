/**
 * @module pages/GiftSuccessPage
 * @description Confirmation page after purchasing a gift code
 * @since 2025-11-21
 */

import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';

/**
 * @component
 * @description Gift purchase success page confirming code delivery via email with options to purchase another or start a design.
 *
 * @returns {JSX.Element} The rendered gift success page
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/gift/success" element={<GiftSuccessPage />} />
 */
export default function GiftSuccessPage(): JSX.Element {
  return (
    <div className="container-max py-12">
      <div className="mx-auto max-w-2xl space-y-4 rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <svg
            className="h-10 w-10 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gift code purchased!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          We’ve emailed you the code. Share it with a friend (or use it yourself) to redeem a free
          tee.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="primary" onClick={() => (window.location.href = '/gift')}>
            Buy another code
          </Button>
          <Link to="/#quickstart">
            <Button variant="secondary">Start a design</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
