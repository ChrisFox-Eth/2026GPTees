/**
 * @module pages/NotFoundPage
 * @description 404 error page
 * @since 2025-11-21
 */

import { Link } from 'react-router-dom';
import { Button } from '@components/Button';

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="container-max py-20">
      <div className="max-w-md mx-auto text-center">
        <div className="text-9xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
