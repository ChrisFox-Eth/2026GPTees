/**
 * @module components/AnimationGallery/AnimationGallery
 * @description Gallery of Framer Motion powered UI patterns showcased on the homepage.
 * Highlights different animation techniques such as entrance effects, hover states,
 * staggered lists, collapsible regions, and draggable surfaces.
 *
 * @component
 * @returns {JSX.Element} Animated gallery sections.
 *
 * @example
 * <AnimationGallery />
 */

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@components/Button';
import { Grid } from '@components/Grid';
import { MotionFadeIn } from '@components/MotionFadeIn';
import type { MotionFadeInDirection } from '@components/MotionFadeIn';
import { MotionHoverCard } from '@components/MotionHoverCard';
import { MotionStaggerList } from '@components/MotionStaggerList';
import { MotionTogglePanel } from '@components/MotionTogglePanel';
import { MotionDraggableCard } from '@components/MotionDraggableCard';
import type { AnimationGallerySection } from './AnimationGallery.types';

export default function AnimationGallery(): JSX.Element {
  const dragBoundsRef = useRef<HTMLDivElement>(null);
  const [showToast, setShowToast] = useState(true);

  const staggerItems = useMemo(
    () => [
      {
        id: 'handoff',
        label: 'Designer → Developer handoff',
        description: 'Track recent updates in shared components.',
      },
      {
        id: 'deploy',
        label: 'Deployment automation',
        description: 'Ship with confidence using preview environments.',
      },
      {
        id: 'analytics',
        label: 'Product analytics',
        description: 'Monitor adoption through funnel insights.',
      },
    ],
    []
  );

  const fadeVariants: Array<{ title: string; dir: MotionFadeInDirection; blurb: string }> = [
    { title: 'Fade up', dir: 'up', blurb: 'Slide upward with soft easing.' },
    { title: 'Fade right', dir: 'right', blurb: 'Glide in from the side.' },
    { title: 'Fade none', dir: 'none', blurb: 'Only opacity when already aligned.' },
  ];

  const sections: AnimationGallerySection[] = [
    {
      title: 'Entrance choreography',
      description: 'Fade-in wrappers animate elements into view as they scroll into the viewport.',
      content: (
        <Grid cols={1} mdCols={3} gap={4}>
          {fadeVariants.map((item) => (
            <MotionFadeIn
              key={item.title}
              direction={item.dir}
          {[
            { title: 'Fade up', dir: 'up', blurb: 'Slide upward with soft easing.' },
            { title: 'Fade right', dir: 'right', blurb: 'Glide in from the side.' },
            { title: 'Fade none', dir: 'none', blurb: 'Only opacity when already aligned.' },
          ].map((item) => (
            <MotionFadeIn
              key={item.title}
              direction={item.dir as const}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.blurb}</p>
            </MotionFadeIn>
          ))}
        </Grid>
      ),
    },
    {
      title: 'Hover storytelling cards',
      description:
        'MotionHoverCard introduces depth with responsive lift, color, and spring physics.',
      content: (
        <Grid cols={1} mdCols={2} gap={4}>
          <MotionHoverCard
            title="Realtime collaboration"
            description="Presence indicators keep squads aligned without context switching."
            icon={
              <span role="img" aria-label="sparkles">
                ✨
              </span>
            }
          />
          <MotionHoverCard
            title="Security posture"
            description="Layered defenses highlight anomalies while staying unobtrusive."
            icon={
              <span role="img" aria-label="shield">
                🛡️
              </span>
            }
          />
        </Grid>
      ),
    },
    {
      title: 'Staggered updates feed',
      description: 'Sequential motion guides the eye through new activity in shared workspaces.',
      content: <MotionStaggerList items={staggerItems} striped />,
    },
    {
      title: 'Animated disclosure',
      description: 'MotionTogglePanel reveals dense documentation with smooth height transitions.',
      content: (
        <MotionTogglePanel title="Release 2.5 highlights" defaultOpen>
          <ul className="list-disc space-y-2 pl-5">
            <li>Parallelized build pipeline reduces CI wait time by 32%.</li>
            <li>Role-based analytics dashboards surface tailored KPIs.</li>
            <li>Improved audit trail exporting with CSV + JSON formats.</li>
          </ul>
        </MotionTogglePanel>
      ),
    },
    {
      title: 'Presence toggles',
      description: 'AnimatePresence controls ephemeral UI like ephemeral toasts and notifications.',
      content: (
        <div className="space-y-4">
          <Button onClick={() => setShowToast((prev) => !prev)}>
            {showToast ? 'Hide toast' : 'Show toast'}
          </Button>
          <AnimatePresence>
            {showToast && (
              <motion.div
                key="toast"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="inline-flex items-center gap-3 rounded-full bg-success-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
              >
                <span role="img" aria-label="party popper">
                  🎉
                </span>
                Deployment succeeded!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      title: 'Draggable prototypes',
      description:
        'Experiment with motion gestures by freely moving cards inside constrained canvases.',
      content: (
        <div
          ref={dragBoundsRef}
          className="flex min-h-[220px] w-full items-center justify-center rounded-2xl border border-dashed border-secondary-400 bg-secondary-50 p-6 dark:border-secondary-700 dark:bg-secondary-900/40"
        >
          <MotionDraggableCard
            title="Storyboard card"
            subtitle="Drag within the dotted frame."
            constraintsRef={dragBoundsRef}
          >
            Add custom controls, comments, or prototypes to bring interactions to life.
          </MotionDraggableCard>
        </div>
      ),
    },
  ];

  return (
    <section aria-labelledby="animation-gallery" className="mt-16">
      <div className="max-w-5xl space-y-4">
        <div>
          <h2 id="animation-gallery" className="text-3xl font-bold text-gray-900 dark:text-white">
            Animation gallery
          </h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
            Explore composable motion patterns built with Framer Motion. Mix and match these
            primitives to enhance storytelling without sacrificing performance.
          </p>
        </div>
        <div className="space-y-12">
          {sections.map((section) => (
            <article key={section.title} className="space-y-4">
              <header>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </header>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {section.content}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
