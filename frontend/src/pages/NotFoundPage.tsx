/**
 * @module pages/NotFoundPage
 * @description 404 error page
 * @since 2025-11-21
 */

import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';

/**
 * @component
 * @description 404 error page displayed when users navigate to non-existent routes. Provides navigation back to home or quickstart.
 *
 * @returns {JSX.Element} The rendered 404 error page
 *
 * @example
 * // Used in App.tsx routing as catch-all
 * <Route path="*" element={<NotFoundPage />} />
 */
export default function NotFoundPage(): JSX.Element {
  return (
    <div className="container-max py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="from-primary-600 mb-4 bg-gradient-to-r to-purple-600 bg-clip-text text-9xl font-bold text-transparent">
          404
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Page Not Found</h1>
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/">
            <Button variant="primary" size="lg">
              Back to Home
            </Button>
          </Link>
          <Link to="/#quickstart">
            <Button variant="secondary" size="lg">
              Start a design
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
