/**
 * @module components/Hero/Hero
 * @description Hero section component for 2026GPTees landing page
 * @component
 * @returns {JSX.Element} Rendered hero section
 * @example
 * <Hero />
 * @since 2025-11-21
 */

import { Link } from 'react-router-dom';
import { Button } from '@components/Button';
import { trackEvent } from '@utils/analytics';

const handleHeroCta = (cta: 'start_creating' | 'how_it_works') => {
  trackEvent('home.hero.cta_click', {
    cta,
    surface: 'hero',
  });
};

export default function Hero(): JSX.Element {
  return (
    <section className="py-20 text-center">
      {/* Main Headline */}
      <div className="mb-6">
        <span className="inline-block bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full mb-4">
          ✨ AI-Powered Custom Apparel
        </span>
      </div>

      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
        Your Ideas,
        <br />
        <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          AI-Designed
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
        Create unique, custom t-shirt designs with the power of AI.
        Just describe your vision, and watch DALL-E 3 bring it to life in seconds.
      </p>

      {/* Value Props */}
      <div className="flex flex-wrap justify-center gap-6 mb-12 text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>AI-Generated Designs</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>High-Quality Printing</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Fast Worldwide Shipping</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/shop">
          <Button
            size="lg"
            className="px-8 py-3 text-lg"
            onClick={() => handleHeroCta('start_creating')}
          >
            Start Creating →
          </Button>
        </Link>
        <a href="#how-it-works">
          <Button
            variant="secondary"
            size="lg"
            className="px-8 py-3 text-lg"
            onClick={() => handleHeroCta('how_it_works')}
          >
            How It Works
          </Button>
        </a>
      </div>

      {/* Trust Badge */}
      <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
        <p>Powered by OpenAI DALL-E 3 • Printed by Printful • Secure Payments</p>
      </div>
    </section>
  );
}
