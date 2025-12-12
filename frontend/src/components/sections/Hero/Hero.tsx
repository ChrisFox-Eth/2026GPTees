/**
 * @module components/sections/Hero
 * @description Hero section with branding, headline, and call-to-action buttons
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders the homepage hero section featuring the GPTees logo, main headline
 * "Limitless tees. Design first, pay when you print.", and CTA buttons to start designing or
 * gift a GPTee. Includes analytics tracking for CTA clicks and smooth scroll to Quickstart section.
 *
 * @returns {JSX.Element} Section element with centered hero content and CTAs
 *
 * @example
 * <Hero />
 */

import { Button } from '@components/ui/Button';
import { trackEvent } from '@utils/analytics';
import { Link } from 'react-router-dom';
import GPTeesBW from '../../../assets/GPTeesIconDarkMode.png';

export default function Hero(): JSX.Element {
  const scrollToQuickstart = () => {
    const el = document.getElementById('quickstart');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="container-max px-4 text-center md:py-16">
      {/* Main Headline */}
      <div className="mb-6 flex justify-center">
        <img
          src={GPTeesBW}
          alt="GPTees logo"
          className="h-24 w-auto drop-shadow-sm"
          loading="lazy"
        />
      </div>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl dark:text-white">
        Limitless tees. Design first, pay when you print.
      </h1>

      <div className="mb-2">
        {/* <span className="inline-block bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full mb-4">
          Make a one-of-one tee in minutes
        </span> */}
      </div>
      <p className="mx-auto mb-8 hidden! max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
        Start with a free preview, iterate with limitless redraws, then pick your color and fit
        before checkout. Every tee is a 1/1 made from your words.
      </p>

      {/* Value Props */}
      {/* <div className="flex flex-wrap justify-center gap-6 mb-6 text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>One-of-one art made from your words</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Super-soft premium tees</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Fast US shipping with tracking</span>
        </div>
      </div> */}

      {/* CTA Buttons */}
      <div className="mb-8 flex flex-row justify-center gap-3 sm:flex-row">
        <Button
          size="md"
          className="hidden! px-6 py-3 text-base"
          onClick={() => {
            trackEvent('home.hero.cta_click', { cta: 'start_creating', surface: 'hero' });
            scrollToQuickstart();
          }}
        >
          Start a tee
        </Button>
        <Link to="/gift">
          <Button
            variant="secondary"
            size="md"
            className="hidden! px-6 py-3 text-base"
            onClick={() =>
              trackEvent('home.hero.cta_click', { cta: 'gift_codes', surface: 'hero' })
            }
          >
            Gift a GPTee
          </Button>
        </Link>
      </div>

      {/* Trust + Delivery */}
      {/* <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-full">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.105-.672-2-1.5-2S9 9.895 9 11s.672 2 1.5 2S12 12.105 12 11z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 11c0-1.105-.672-2-1.5-2s-1.5.895-1.5 2 .672 2 1.5 2 1.5-.895 1.5-2zM3 11c0-1.105.672-2 1.5-2S6 9.895 6 11s-.672 2-1.5 2S3 12.105 3 11z" /></svg>
          Super-soft premium tees
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-full">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          One-of-one art made from your words
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-full">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89-5.26a2 2 0 012.22 0L21 8m-9 13V10" /></svg>
          Ships in 5-8 business days
        </span>
      </div> */}
      {/* Trust Badge */}
      {/* <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <p>One prompt • Unlimited redraws • You approve before we print</p>
      </div> */}
    </section>
  );
}
