/**
 * @module components/SocialProofStrip
 * @description Trust strip with rotating blurbs.
 */

import { useEffect, useMemo, useState } from 'react';

const BLURBS = [
  'A T-Rex playing video games.',
  'The planet Saturn, but its rings are made of cheese.',
  'An old-timey telephone with a silly pun on the line.',
];

// const TRUST_BADGES = ['Super-soft GPTee', 'Secure checkout', 'Fast US shipping'];

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

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
        <span className="inline-flex items-center justify-center h-6 px-3 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 text-xs font-semibold whitespace-nowrap">
          Need help?
        </span>
        <span className="hidden sm:inline text-gray-500 dark:text-gray-400">|</span>
        <span className="text-sm text-gray-700 dark:text-gray-200">{currentBlurb}</span>
      </div>
      {/* <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
        {TRUST_BADGES.map((badge) => (
          <span
            key={badge}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          >
            <span aria-hidden="true">*</span>
            {badge}
          </span>
        ))}
      </div> */}
    </div>
  );
}
