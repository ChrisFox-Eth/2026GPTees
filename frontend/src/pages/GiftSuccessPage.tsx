/**
 * @module pages/GiftSuccessPage
 * @description Confirmation page after purchasing a gift code
 */

import { Link } from 'react-router-dom';
import { Button } from '@components/Button';

export default function GiftSuccessPage(): JSX.Element {
  return (
    <div className="container-max py-12">
      <div className="max-w-2xl mx-auto text-center space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gift code purchased!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          We’ve emailed you the code. Share it with a friend (or use it yourself) to redeem a free tee.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
