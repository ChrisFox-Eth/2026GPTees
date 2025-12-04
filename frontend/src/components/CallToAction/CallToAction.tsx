/**
 * @module components/CallToAction
 * @description Call to action section encouraging users to start
 * @since 2025-11-21
 */

import { Link } from 'react-router-dom';
import { Button } from '@components/Button';
import { trackEvent } from '@utils/analytics';

export default function CallToAction(): JSX.Element {
  const handleCtaClick = (cta: 'browse_products' | 'view_orders') => {
    trackEvent('home.cta.click', {
      cta,
      surface: 'call_to_action',
    });
  };

  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600">
      <div className="container-max text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to drop your 1/1 GPTee?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Classic is one-shot. Limitless lets you keep redrawing with new prompts until you approve. Your idea, your call.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/shop">
            <Button
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg"
              onClick={() => handleCtaClick('browse_products')}
            >
              Browse Products
            </Button>
          </Link>
          <Link to="/gift">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white/10 border-2 border-white text-white hover:bg-white/15 px-8 py-3 text-lg"
              onClick={() => trackEvent('home.cta.click', { cta: 'gift_codes', surface: 'call_to_action' })}
            >
              Gift a GPTee
            </Button>
          </Link>
          <Link to="/account">
            <Button
              variant="secondary"
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
              onClick={() => handleCtaClick('view_orders')}
            >
              View My Orders
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
