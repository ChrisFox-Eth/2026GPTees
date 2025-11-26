/**
 * @module components/PricingSection
 * @description Pricing tiers display section
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@components/Button';
import { trackEvent } from '@utils/analytics';
import { apiGet } from '@utils/api';

interface TierCard {
  name: string;
  displayName: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  badge?: string;
}

const DEFAULT_TIERS: TierCard[] = [
  {
    name: 'Basic',
    displayName: 'Classic',
    price: '$34.99',
    description: '1 artwork included',
    features: [
      'Super-soft GPTee',
      '1 artwork crafted from your words',
      'Free redraws until you approve',
      'High-quality printing & shipping',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Premium',
    displayName: 'Limitless',
    price: '$54.99',
    description: 'Unlimited redraws',
    features: [
      'Super-soft GPTee',
      'Unlimited redraws until you love it',
      'Free redraws until you approve',
      'High-quality printing & shipping',
    ],
    cta: 'Go Limitless',
    highlighted: true,
    badge: 'Most choose this',
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

        if (!tierPricing || cancelled) return;

        setTiers((current) =>
          current.map((tier) => {
            const key = tier.name.toUpperCase();
            const config = tierPricing[key];
            if (!config) return tier;
            return {
              ...tier,
              price: formatPrice(config.price),
              description: config.description || tier.description,
            };
          })
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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Both options include the tee, custom artwork from your words, and fast shipping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ${
                tier.highlighted
                  ? 'ring-2 ring-primary-500 scale-105'
                  : 'ring-1 ring-gray-200 dark:ring-gray-700'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.displayName}
                </h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {tier.price}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{tier.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Ships in 5-8 business days • Secure checkout by Stripe
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
              <Link to="/shop" className="block">
                <Button
                  variant={tier.highlighted ? 'primary' : 'secondary'}
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

        <p className="text-center text-gray-500 dark:text-gray-400 mt-12">
          All prices include the tee, printing, and artwork creation. Shipping calculated at checkout.
        </p>
      </div>
    </section>
  );
}
