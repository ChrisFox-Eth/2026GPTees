/**
 * @module components/sections/PricingSection
 * @description Pricing tiers display section with dynamic price loading from API
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders the pricing section featuring the Limitless plan tier with dynamically loaded
 * pricing from the API. Displays price, description, feature list, and CTA button. Falls back to
 * default pricing if API fails. Includes analytics tracking for plan selection and links to Quickstart.
 *
 * @returns {JSX.Element} Section element with pricing tier card and features
 *
 * @example
 * <PricingSection />
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { trackEvent } from '@utils/analytics';
import { apiGet } from '@utils/api';
import {
  applyPercentOff,
  formatHappyHolidaysEndsShort,
  formatUsdAmount,
  HAPPY_HOLIDAYS_CODE,
  HAPPY_HOLIDAYS_PERCENT_OFF,
  isHappyHolidaysActive,
  parseUsdAmount,
} from '@utils/holidayPromo';
import type { TierCard } from './PricingSection.types';

const DEFAULT_TIERS: TierCard[] = [
  {
    name: 'Limitless',
    displayName: 'Limitless',
    price: '$54.99',
    description: 'One price. Studio access included.',
    features: [
      'Super-soft premium tee',
      'Explore design options at your own pace',
      'Preview on all four colors before checkout',
      'Choose size and fit after approving your design',
      'High-quality printing with tracked shipping',
    ],
    cta: 'Start designing',
    highlighted: true,
    badge: 'Design-first',
  },
];

/**
 * Format price string with dollar sign.
 */
const formatPrice = (value: number | undefined): string =>
  value !== undefined ? `$${Number(value).toFixed(2)}` : '$--';

export default function PricingSection(): JSX.Element {
  const [tiers, setTiers] = useState<TierCard[]>(DEFAULT_TIERS);
  const holidayPromoActive = isHappyHolidaysActive();

  useEffect(() => {
    let cancelled = false;

    const loadPricing = async () => {
      try {
        const response = await apiGet('/api/products');
        const products = response?.data || [];
        const firstProduct = Array.isArray(products) ? products[0] : null;
        const tierPricing = firstProduct?.tierPricing;
        const price =
          tierPricing?.PREMIUM?.price ?? tierPricing?.LIMITLESS?.price ?? firstProduct?.basePrice;

        if (!price || cancelled) return;

        setTiers((current) =>
          current.map((tier) => ({
            ...tier,
            price: formatPrice(price),
            description: tier.description,
          }))
        );
      } catch (error) {
        console.error('Failed to load pricing from API', error);
      }
    };

    loadPricing();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-surface py-20 dark:bg-surface-dark">
      <div className="container-max">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold leading-tight text-ink md:text-5xl dark:text-ink-dark">
            Simple Pricing
          </h2>
          <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-muted md:text-lg dark:text-muted-dark">
            One tier. Preview for free, explore options, pay when you print.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-1">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl bg-surface p-8 shadow-soft dark:bg-surface-dark ${
                tier.highlighted
                  ? 'scale-105 ring-2 ring-accent dark:ring-accent-dark'
                  : 'ring-1 ring-muted/20 dark:ring-muted-dark/20'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="rounded-full bg-accent px-4 py-1 font-sans text-sm font-bold text-white shadow-medium dark:bg-accent-dark">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6 text-center">
                <h3 className="mb-2 font-display text-2xl font-bold text-ink dark:text-ink-dark">
                  {tier.displayName}
                </h3>
                <div className="mb-2">
                  {(() => {
                    const base = parseUsdAmount(tier.price);
                    if (!holidayPromoActive || base === null) {
                      return (
                        <span className="font-display text-5xl font-bold text-ink dark:text-ink-dark">
                          {tier.price}
                        </span>
                      );
                    }

                    const discounted = applyPercentOff(base, HAPPY_HOLIDAYS_PERCENT_OFF);
                    return (
                      <div className="flex items-baseline justify-center gap-3">
                        <span className="font-sans text-sm font-semibold text-muted line-through dark:text-muted-dark">
                          {tier.price}
                        </span>
                        <span className="font-display text-5xl font-bold text-ink dark:text-ink-dark">
                          {formatUsdAmount(discounted)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <p className="font-sans text-muted dark:text-muted-dark">{tier.description}</p>
                {holidayPromoActive && (
                  <p className="mt-2 font-sans text-sm text-accent dark:text-accent-dark">
                    Holiday sale: {HAPPY_HOLIDAYS_PERCENT_OFF}% off with code{' '}
                    <span className="font-mono">{HAPPY_HOLIDAYS_CODE}</span> (ends {formatHappyHolidaysEndsShort()})
                  </p>
                )}
                <p className="mt-2 font-sans text-sm text-muted dark:text-muted-dark">
                  Ships in 5-8 business days | Secure checkout by Stripe
                </p>
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-sans text-muted dark:text-muted-dark">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/#quickstart" className="block">
                <Button
                  variant="primary"
                  className="w-full bg-accent text-white hover:opacity-90 dark:bg-accent-dark"
                  size="lg"
                  onClick={() =>
                    trackEvent('pricing.plan.select', {
                      plan_name: tier.name.toLowerCase(),
                      highlighted: tier.highlighted,
                    })
                  }
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center font-sans text-muted dark:text-muted-dark">
          All prices include the product, printing, and artwork creation. Shipping calculated at checkout.
        </p>
      </div>
    </section>
  );
}
