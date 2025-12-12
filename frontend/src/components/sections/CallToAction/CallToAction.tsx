/**
 * @module components/sections/CallToAction
 * @description Call to action section encouraging users to start designing, gift GPTees, or view their orders
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a quiet, confident CTA section with cobalt accent background, primary heading,
 * description, and action buttons. Includes analytics tracking for all CTA clicks.
 *
 * @returns {JSX.Element} Section element with CTA buttons
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
    <section className="bg-accent py-20 dark:bg-accent-dark">
      <div className="container-max text-center">
        <h2 className="mb-6 font-display text-3xl font-bold leading-tight text-white md:text-5xl">
          Ready to create?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl font-sans text-base leading-relaxed text-white/90 md:text-lg">
          Describe your idea, preview the artwork, then choose fit and color. Simple as that.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/#quickstart">
            <Button
              size="lg"
              className="border-2 border-white bg-white px-8 py-3 text-lg text-accent hover:bg-white/90 dark:text-accent-dark"
              onClick={() => handleCtaClick('browse_products')}
            >
              Start designing
            </Button>
          </Link>
          <Link to="/gift">
            <Button
              variant="secondary"
              size="lg"
              className="border-2 border-white bg-transparent px-8 py-3 text-lg text-white hover:bg-white/10"
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
