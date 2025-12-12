/**
 * @module components/sections/CallToAction
 * @description Call to action section encouraging users to start designing, gift GPTees, or view their orders
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a gradient background CTA section with primary heading, description, and three
 * action buttons: "Start a Limitless tee", "Gift a GPTee", and "View My Orders". Includes analytics
 * tracking for all CTA clicks. Used on the homepage to drive conversions.
 *
 * @returns {JSX.Element} Section element with gradient background and CTA buttons
 *
 * @example
 * <CallToAction />
 */

import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { trackEvent } from '@utils/analytics';

export default function CallToAction(): JSX.Element {
  const handleCtaClick = (cta: 'browse_products' | 'view_orders') => {
    trackEvent('home.cta.click', {
      cta,
      surface: 'call_to_action',
    });
  };

  return (
    <section className="from-primary-600 bg-gradient-to-r to-purple-600 py-20">
      <div className="container-max text-center">
        <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
          Ready to drop your 1/1 GPTee?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-white/90">
          One Limitless plan: generate free previews, redraw until it is perfect, then pick color
          and fit before checkout.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/#quickstart">
            <Button
              size="lg"
              className="bg-primary-600 border-2 border-white px-8 py-3 text-lg text-white hover:bg-gray-100"
              onClick={() => handleCtaClick('browse_products')}
            >
              Start a Limitless tee
            </Button>
          </Link>
          <Link to="/gift">
            <Button
              variant="secondary"
              size="lg"
              className="border-2 border-white bg-white/10 px-8 py-3 text-lg text-white hover:bg-white/15"
              onClick={() =>
                trackEvent('home.cta.click', { cta: 'gift_codes', surface: 'call_to_action' })
              }
            >
              Gift a GPTee
            </Button>
          </Link>
          <Link to="/account">
            <Button
              variant="secondary"
              size="lg"
              className="border-2 border-white bg-transparent px-8 py-3 text-lg text-white hover:bg-white/10"
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
