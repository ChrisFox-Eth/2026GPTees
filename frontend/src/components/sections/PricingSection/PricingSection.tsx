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
import type { TierCard } from './PricingSection.types';

const DEFAULT_TIERS: TierCard[] = [
  {
    name: 'Limitless',
    displayName: 'Limitless',
    price: '$54.99',
    description: 'Design first, pay when you print. Unlimited redraws included.',
    features: [
      'Super-soft GPTee',
      'Unlimited redraws until you love it',
      'Preview on all four colors before checkout',
      'Choose size and fit after you see the design',
      'High-quality printing & tracked shipping',
    ],
    cta: 'Start Limitless',
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
    <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-800">
      <div className="container-max">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            One Limitless plan: generate for free, refine without limits, pay when you print.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-1">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 ${
                tier.highlighted
                  ? 'ring-primary-500 scale-105 ring-2'
                  : 'ring-1 ring-gray-200 dark:ring-gray-700'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="from-primary-600 rounded-full bg-gradient-to-r to-purple-600 px-4 py-1 text-sm font-bold text-white shadow-lg">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6 text-center">
                <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {tier.displayName}
                </h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {tier.price}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{tier.description}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/#quickstart" className="block">
                <Button
                  variant="primary"
                  className="w-full"
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

        <p className="mt-12 text-center text-gray-500 dark:text-gray-400">
          All prices include the tee, printing, and artwork creation. Shipping calculated at
          checkout.
        </p>
      </div>
    </section>
  );
}
