/**
 * @module pages/GiftPage
 * @description Gift code purchase flow
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@components/ui/Button';
import { apiPost } from '@utils/api';
import { trackEvent } from '@utils/analytics';
import type { GiftTierOption } from '../types/promo';

/**
 * @component
 * @description Gift code purchase page allowing users to buy redeemable codes for Limitless GPTees. Redirects to Stripe checkout and handles authentication.
 *
 * @returns {JSX.Element} The rendered gift purchase page
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/gift" element={<GiftPage />} />
 */
export default function GiftPage(): JSX.Element {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const navigate = useNavigate();
  const [tier] = useState<GiftTierOption>('PREMIUM');
  const [usageLimit] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth?redirect=/gift');
    }
  }, [isLoaded, isSignedIn]);

  const handlePurchase = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Please sign in to purchase a gift code.');
        return;
      }
      trackEvent('gift.purchase.start', { tier, usage_limit: usageLimit });
      const res = await apiPost('/api/gift-codes/purchase', { tier, usageLimit }, token);
      const url = res?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to start gift purchase.');
      trackEvent('gift.purchase.error', { message: err?.message || 'unknown' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-max py-8">
      <div className="mx-auto max-w-3xl space-y-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="space-y-2">
          <p className="text-primary-700 dark:text-primary-200 text-sm font-semibold tracking-wide uppercase">
            Gifting
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gift a one-of-one GPTee
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send someone a redeemable code so they can design their own tee. Limitless includes
            unlimited redraws until they love it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-primary-500 bg-primary-50 dark:bg-primary-900/20 rounded-lg border p-4 text-left">
            <p className="font-semibold text-gray-900 dark:text-white">Limitless Tee</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unlimited redraws until they say &ldquo;perfect&rdquo;
            </p>
          </div>
        </div>

        {/* <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Uses (optional)
          </label>
          <input
            type="number"
            min={1}
            value={usageLimit}
            onChange={(e) => setUsageLimit(Math.max(1, Number(e.target.value)))}
            className="w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Default is single-use. Increase if you want the code to work multiple times.
          </p>
        </div> */}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" onClick={handlePurchase} disabled={isSubmitting}>
            {isSubmitting ? 'Starting checkout...' : 'Gift this GPTee'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/#quickstart')}>
            Start a design
          </Button>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <p className="mb-1 font-semibold">How gifting works</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>You check out now via Stripe.</li>
            <li>We email you the gift code instantly.</li>
            <li>
              Your friend redeems it for a Limitless tee and designs to their heart&apos;s content.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
