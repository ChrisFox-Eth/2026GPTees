/**
 * @module pages/CheckoutSuccessPage
 * @description Checkout success page after payment
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/Button';
import { useCart } from '../hooks/useCart';
import { apiPost } from '@utils/api';
import { trackEvent } from '@utils/analytics';

export default function CheckoutSuccessPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [isCleared, setIsCleared] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Clear cart after successful payment (only once)
    if (!isCleared) {
      clearCart();
      setIsCleared(true);
    }
  }, [clearCart, isCleared]);

  useEffect(() => {
    if (orderId && sessionId) {
      trackEvent('checkout.success.view', {
        order_id: orderId,
        session_id: sessionId,
      });
    }
  }, [orderId, sessionId]);

  const confirmPayment = async () => {
    if (!orderId || !sessionId) return;
    try {
      setIsConfirming(true);
      setConfirmError(null);
      trackEvent('checkout.success.confirm_click', {
        order_id: orderId,
        session_id: sessionId,
      });
      await apiPost('/api/payments/confirm-session', {
        orderId,
        sessionId,
      });
      // After confirming, push user to design page
      navigate(`/design?orderId=${orderId}`);
    } catch (err: any) {
      trackEvent('checkout.success.confirm_error', {
        order_id: orderId,
        message: err?.message || 'unknown',
      });
      setConfirmError(err.message || 'Could not confirm payment. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/design?orderId=${orderId ?? ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'I just ordered a custom AI tee on GPTees!',
          text: 'Create your own in seconds.',
          url: shareUrl,
        });
        setShareMessage('Thanks for sharing!');
        trackEvent('checkout.success.share', {
          order_id: orderId,
          method: 'web_share',
        });
      } catch {
        // user cancelled; no-op
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('Link copied—share it with friends!');
      trackEvent('checkout.success.share', {
        order_id: orderId,
        method: 'clipboard',
      });
    }
  };

  if (!orderId || !sessionId) {
    return (
      <div className="container-max py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Session</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No order information found.
          </p>
          <Link to="/shop">
            <Button variant="primary">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max py-12">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your order has been placed successfully
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            What's Next?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Generate Your Design</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use AI to create your custom t-shirt design
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Approve Your Design</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review and approve your AI-generated design
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">We Print & Ship</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your custom t-shirt will be printed and shipped to you
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 mb-6">
          <p className="text-sm text-primary-800 dark:text-primary-200">
            <strong>Order ID:</strong> {orderId}
          </p>
          <p className="text-sm text-primary-800 dark:text-primary-200 mt-1">
            <strong>Session ID:</strong> {sessionId}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="primary"
            onClick={() => navigate(`/design?orderId=${orderId}`)}
            className="flex-1"
          >
            Generate My Design
          </Button>
          <Link to="/account" className="flex-1">
            <Button variant="secondary" className="w-full">
              View My Orders
            </Button>
          </Link>
          <Button variant="secondary" onClick={handleShare} className="flex-1">
            Share with Friends
          </Button>
        </div>

        {shareMessage && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">{shareMessage}</p>
        )}

        {/* Manual payment confirmation helper */}
        {orderId && sessionId && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Having trouble reaching the design page?
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Manually confirm your Stripe session, then continue.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={confirmPayment}
                disabled={isConfirming}
              >
                {isConfirming ? 'Confirming...' : 'Confirm Payment'}
              </Button>
            </div>
            {confirmError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">{confirmError}</p>
            )}
          </div>
        )}

        {/* Email Confirmation */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          A confirmation email has been sent to your email address
        </p>
      </div>
    </div>
  );
}
