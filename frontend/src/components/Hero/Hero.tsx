/**
 * @module components/Hero/Hero
 * @description Hero section component for landing page
 * @component
 * @returns {JSX.Element} Rendered hero section
 * @example
 * <Hero />
 * @since 2025-10-20
 * @author Template
 */

import { Button } from '@components/Button';

export default function Hero(): JSX.Element {
  return (
    <section className="py-20 text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to Your React Template
      </h2>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        A modern, fully-featured React 18 template with TypeScript, Tailwind CSS, and a Node/Express backend. Ready for your next project.
      </p>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => alert('Get started!')}>Get Started</Button>
        <Button variant="secondary" onClick={() => alert('Learn more')}>
          Learn More
        </Button>
      </div>
    </section>
  );
}
