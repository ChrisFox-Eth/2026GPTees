/**
 * @module components/SocialProofStrip
 * @description Trust strip with rotating blurbs.
 */

import { useEffect, useMemo, useState } from 'react';
import { trackEvent } from '@utils/analytics';

const BLURBS = [
  'A corgi astronaut planting a GPTees flag on the moon.',
  'Vintage arcade cabinet that says “Insert vibes to play.”',
  'Neon dragon riding a bicycle through a cyberpunk alley.',
  'Minimal line-art koi fish with flowing neon water.',
  'Retro surf van at sunset with a giant wave made of clouds.',
  '“404: Boring tee not found” in bold glitch type.',
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
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
        <button
          type="button"
          onClick={handleUseIdea}
          className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 text-xs font-semibold whitespace-nowrap hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
        >
          Use this idea
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-200">{currentBlurb}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 dark:text-gray-300">
        
      </div>
    </div>
  );
}
