/**
 * @module pages/HomePage
 * @description Home page for 2026GPTees - AI-powered custom apparel
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

export default function HomePage(): JSX.Element {
  return (
    <main>
      <div className="container-max py-8">
        <Hero />
        <div className="mt-8">
          <Quickstart />
        </div>
        <div className="mt-6">
          <SocialProofStrip />
        </div>
      </div>
      <HowItWorks />
      <div className="container-max py-6">
        <ExamplesGallery />
      </div>
      <Features />
      <PricingSection />
      <CallToAction />
    </main>
  );
}
