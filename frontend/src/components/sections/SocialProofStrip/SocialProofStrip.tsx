/**
 * @module components/sections/SocialProofStrip
 * @description Trust strip with rotating design idea examples to inspire users
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a strip with rotating design idea examples that users can click to try.
 * Features automatic rotation every 4 seconds (respects prefers-reduced-motion). Clicking "Try it"
 * prefills the Quickstart component with the selected idea and scrolls to it. Currently hidden
 * via CSS (hidden! class). Includes analytics tracking for idea selections.
 *
 * @returns {JSX.Element} Horizontal strip with rotating idea examples and action button
 *
 * @example
 * <SocialProofStrip />
 */

import { useEffect, useMemo, useState } from 'react';
import { trackEvent } from '@utils/analytics';

const BLURBS = [
  'A neon ramen bowl where the noodles form a spiral galaxy.',
  'A symmetrical tiger mask built from geometric facets.',
  'A phoenix made of ink splashes and sharp brush strokes.',
  'A shattered stained-glass butterfly with prismatic shards.',
  'A cosmic koi fish shaped like a crescent moon.',
  'A dragonfly made of circuit traces, sleek tech aesthetic.',
];

// const TRUST_BADGES = [''];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export default function SocialProofStrip(): JSX.Element {
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const currentBlurb = useMemo(() => BLURBS[index % BLURBS.length], [index]);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setIndex((prev) => (prev + 1) % BLURBS.length), 4000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const handleUseIdea = () => {
    const idea = currentBlurb;
    trackEvent('social_proof.use_idea', { idea });
    window.dispatchEvent(
      new CustomEvent('gptees.quickstart.prefill', {
        detail: { prompt: idea },
      })
    );
    const target = document.querySelector('#quickstart');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Slight nudge up so QuickStart header is visible on mobile
      setTimeout(() => window.scrollBy({ top: -100, behavior: 'smooth' }), 200);
    }
  };

  return (
    <div className="hidden! flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
        <button
          type="button"
          onClick={handleUseIdea}
          className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-800 inline-flex h-7 items-center justify-center rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors"
        >
          Try it
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-200">{currentBlurb}</span>
      </div>
    </div>
  );
}
