/**
 * @module pages/GiftPage
 * @description Gift code purchase flow
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@components/Button';
import { apiPost } from '@utils/api';
import { trackEvent } from '@utils/analytics';

type TierOption = 'BASIC' | 'PREMIUM';

export default function GiftPage(): JSX.Element {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const navigate = useNavigate();
  const [tier, setTier] = useState<TierOption>('BASIC');
  const [usageLimit, setUsageLimit] = useState(1);
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
      const res = await apiPost(
        '/api/gift-codes/purchase',
        { tier, usageLimit },
        token
      );
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
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-primary-700 dark:text-primary-200 font-semibold uppercase tracking-wide">
            Gift a GPTee
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Send a gift code</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Buy a code for a friend. They redeem it for a free tee. Shipping is paid at redemption.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTier('BASIC')}
            className={`p-4 border rounded-lg text-left transition ${
              tier === 'BASIC'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <p className="font-semibold text-gray-900 dark:text-white">Classic Tee</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">1 artwork included</p>
          </button>
          <button
            type="button"
            onClick={() => setTier('PREMIUM')}
            className={`p-4 border rounded-lg text-left transition ${
              tier === 'PREMIUM'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <p className="font-semibold text-gray-900 dark:text-white">Limitless Tee</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Unlimited redraws</p>
          </button>
        </div>

        <div className="space-y-2">
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
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" onClick={handlePurchase} disabled={isSubmitting}>
            {isSubmitting ? 'Starting checkout...' : 'Buy gift code'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/shop')}>
            Back to shop
          </Button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-semibold mb-1">How it works</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>You pay for the code now via Stripe.</li>
            <li>We email you the code.</li>
            <li>Recipient redeems at checkout for the chosen tier (shipping not included).</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
