/**
 * @module pages/HomePage
 * @description Home page for 2026GPTees
 * @since 2025-11-21
 */

import Hero from '@components/Hero/Hero';
import { Gallery } from '@components/Gallery';
import { AnimationGallery } from '@components/AnimationGallery';

export default function HomePage(): JSX.Element {
  return (
    <main className="container-max py-8 space-y-16">
      <Hero />
      <Gallery />
      <AnimationGallery />
    </main>
  );
}
