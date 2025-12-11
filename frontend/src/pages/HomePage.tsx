/**
 * @module pages/HomePage
 * @description Home page for GPTees - one-of-one custom apparel
 * @since 2025-11-21
 */

import Hero from '@components/Hero/Hero';
import { HowItWorks } from '@components/HowItWorks';
import { Features } from '@components/Features';
import { PricingSection } from '@components/PricingSection';
import { CallToAction } from '@components/CallToAction';
import { Quickstart } from '@components/Quickstart';
import SocialProofStrip from '@components/SocialProofStrip/SocialProofStrip';
import { ExamplesGallery } from '@components/ExamplesGallery';
import { StickyCtaBar } from '@components/StickyCtaBar/StickyCtaBar';
import { Link } from 'react-router-dom';

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
