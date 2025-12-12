/**
 * @module pages/HomePage
 * @description Home page for GPTees - one-of-one custom apparel
 * @since 2025-11-21
 */

import Hero from '@components/sections/Hero/Hero';
import { HowItWorks } from '@components/sections/HowItWorks';
import { Features } from '@components/sections/Features';
import { PricingSection } from '@components/sections/PricingSection';
import { CallToAction } from '@components/sections/CallToAction';
import { Quickstart } from '@components/sections/Quickstart';
import SocialProofStrip from '@components/sections/SocialProofStrip/SocialProofStrip';
import { ExamplesGallery } from '@components/sections/ExamplesGallery';
import { StickyCtaBar } from '@components/sections/StickyCtaBar/StickyCtaBar';
import { Link } from 'react-router-dom';

/**
 * @component
 * @description Home page for GPTees featuring hero section, social proof, quickstart, how it works, examples gallery, features, pricing, and call-to-action sections.
 *
 * @returns {JSX.Element} The rendered home page
 *
 * @example
 * // Used in App.tsx routing
 * <Route path="/" element={<HomePage />} />
 */
export default function HomePage(): JSX.Element {
  return (
    <main>
      <div className="container-max py-8">
        <Hero />
        <div className="mt-3">
          <SocialProofStrip />
        </div>
        <div className="" id="quickstart">
          <Quickstart />
        </div>
      </div>
      <HowItWorks />
      <div className="container-max py-6">
        <ExamplesGallery />
      </div>
      <Features />
      <PricingSection />
      <CallToAction />
      <Link to="/#quickstart">
        <StickyCtaBar
          primaryLabel="Start your Limitless tee for $54.99 — design first"
          subcopy="Unlimited redraws, pay when you print"
          href="#quickstart"
        />
      </Link>
    </main>
  );
}
