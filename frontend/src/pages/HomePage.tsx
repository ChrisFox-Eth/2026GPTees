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

export default function HomePage(): JSX.Element {
  return (
    <main>
      <div className="container-max py-8">
        <Hero />
      </div>
      <HowItWorks />
      <Features />
      <PricingSection />
      <CallToAction />
    </main>
  );
}
