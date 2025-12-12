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
import { fadeUp } from '@utils/motion';
import { motion } from 'framer-motion';
import GPTeesLifestyleHero from '@assets/GPTeesLifestyleHero.png';

export default function Hero(): JSX.Element {
  const scrollToQuickstart = () => {
    const el = document.getElementById('quickstart');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="container-max bg-paper px-4 pt-12 text-center dark:bg-paper-dark">
      <motion.div {...fadeUp} className="mx-auto max-w-4xl">
        {/* Hero Headline */}
        <h1 className="mb-4 text-3xl font-serif-display leading-tight text-ink md:text-6xl lg:text-7xl dark:text-ink-dark">
          Design a tee that doesn&apos;t exist yet.
        </h1>

        {/* Hero Lifestyle Image */}
        <div className="mb-4">
          <img className='rounded-2xl h-[400px] w-full object-cover' src={GPTeesLifestyleHero} alt="Hero lifestyle image" />
        </div>

        {/* Minimal Subcopy */}
        <p className="mx-auto mb-4 max-w-2xl font-sans text-base leading-relaxed text-muted md:text-lg dark:text-muted-dark">
          Describe your idea, preview the artwork, then choose fit and color.
        </p>

        {/* Primary CTA */}
        <div className="mb-4 justify-center hidden md:flex">
          <Button
            size="lg"
            className="bg-accent px-8 py-3 text-base text-white hover:opacity-90 dark:bg-accent-dark"
            onClick={() => {
              trackEvent('home.hero.cta_click', { cta: 'start_creating', surface: 'hero' });
              scrollToQuickstart();
            }}
          >
            Start designing
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
