/**
 * @module components/sections/HowItWorks
 * @description How It Works section explaining the four-step GPTees design and ordering process
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a four-step process guide with editorial design.
 * Updated copy to avoid "AI" language and frame exploration as optional creative choice.
 *
 * @returns {JSX.Element} Section element with grid of process step cards
 *
 * @example
 * <HowItWorks />
 */

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@utils/motion';

export default function HowItWorks(): JSX.Element {
  const steps = [
    {
      number: '1',
      title: 'Start your design',
      description:
        'Enter your idea in Quickstart. We create a preview instantly—no payment required.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      number: '2',
      title: 'Describe your idea',
      description:
        'Tell us what to create. From bold graphics to minimal art, describe your vision.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      number: '3',
      title: 'Explore options',
      description:
        'Want to try a different direction? Refine your idea as much as you like—it\'s part of your studio access.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
    },
    {
      number: '4',
      title: 'Approve and ship',
      description:
        'Preview on all colors, choose your fit and size, then check out. We print and ship once you approve.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="bg-surface-2 py-20 dark:bg-surface-dark">
      <div className="container-max">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold leading-tight text-ink md:text-5xl dark:text-ink-dark">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-muted md:text-lg dark:text-muted-dark">
            From idea to wearable art in just a few steps.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={staggerItem}
              className="relative"
            >
              {/* Connection Line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="absolute top-16 left-1/2 hidden h-0.5 w-full bg-gradient-to-r from-accent/40 to-transparent lg:block dark:from-accent-dark/40" />
              )}

              {/* Step Card */}
              <div className="relative rounded-xl bg-surface p-6 shadow-soft transition-shadow hover:shadow-medium dark:bg-surface-dark">
                {/* Step Number */}
                <div className="absolute -top-4 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-white shadow-medium dark:bg-accent-dark">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="mt-8 mb-4 text-accent dark:text-accent-dark">{step.icon}</div>

                {/* Content */}
                <h3 className="mb-3 font-display text-xl font-bold text-ink dark:text-ink-dark">
                  {step.title}
                </h3>
                <p className="font-sans leading-relaxed text-muted dark:text-muted-dark">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
