/**
 * @module components/sections/ExamplesGallery
 * @description Small gallery of real designs pulled from Supabase to showcase community creations
 * @since 2025-11-21
 */

/**
 * @component
 * @description Fetches and displays a lookbook-style grid gallery of real user-generated designs from the API.
 * Features loading skeletons, error handling, clickable thumbnails with modal preview, hover lift effects,
 * and the ability to use any design's prompt in the Quickstart component. Shows up to 24 recent designs.
 *
 * @returns {JSX.Element} Gallery grid with design thumbnails and modal for detailed view
 *
 * @example
 * <ExamplesGallery />
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiGet } from '@utils/api';
import { hoverLift, staggerContainer, staggerItem } from '@utils/motion';
import type { GalleryDesign } from '../../../types/gallery';
import { ImagePlaceholder } from '@components/ui/ImagePlaceholder';

const LIMIT = 6;

export default function ExamplesGallery(): JSX.Element {
  const [designs, setDesigns] = useState<GalleryDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GalleryDesign | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await apiGet(`/api/designs/gallery?limit=${LIMIT}`);
        if (cancelled) return;
        setDesigns((response?.data as GalleryDesign[]) || []);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Unable to load gallery right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-4 md:grid-cols-3"
        >
          {Array.from({ length: LIMIT }).map((_, idx) => (
            <motion.div key={`skeleton-${idx}`} variants={staggerItem}>
              <ImagePlaceholder aspectRatio="4/5" />
            </motion.div>
          ))}
        </motion.div>
      );
    }

    if (error) {
      return <div className="font-sans text-sm text-red-600 dark:text-red-400">{error}</div>;
    }

    if (!designs.length) {
      return (
        <p className="font-sans text-sm text-muted dark:text-muted-dark">
          New designs are on the way. Check back soon.
        </p>
      );
    }

    return (
      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        className="grid grid-cols-2 gap-4 md:grid-cols-3"
      >
        {designs.map((design) => {
          const preview = design.thumbnailUrl || design.imageUrl;
          return (
            <motion.button
              type="button"
              key={design.id}
              onClick={() => setSelected(design)}
              variants={staggerItem}
              {...hoverLift}
              className="group relative overflow-hidden rounded-lg focus-visible:outline-accent focus-visible:outline-2"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-lg border border-muted/20 bg-surface dark:border-muted-dark/20 dark:bg-surface-dark">
                <img
                  src={preview}
                  alt={design.prompt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <figcaption className="absolute right-2 bottom-2 left-2 line-clamp-2 rounded-md bg-ink/80 px-3 py-2 font-sans text-xs text-surface opacity-0 transition-opacity group-hover:opacity-100 dark:bg-ink-dark/80 dark:text-surface-dark">
                {design.revisedPrompt || design.prompt}
              </figcaption>
            </motion.button>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div
      className="rounded-xl border border-muted/20 bg-surface p-4 shadow-soft sm:p-5 dark:border-muted-dark/20 dark:bg-surface-dark"
      id="gallery"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
            Lookbook
          </p>
          <p className="font-sans text-xs text-muted dark:text-muted-dark">
            Recent designs from the studio.
          </p>
        </div>
      </div>
      {renderContent()}

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm dark:bg-ink-dark/70"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-muted/20 bg-surface shadow-lifted dark:border-muted-dark/20 dark:bg-surface-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-muted/20 px-4 py-3 dark:border-muted-dark/20">
              <p className="truncate font-sans text-sm font-semibold text-ink dark:text-ink-dark">
                {selected.revisedPrompt || selected.prompt}
              </p>
              <button
                type="button"
                className="font-sans text-sm text-muted transition-colors hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="flex items-center justify-center bg-surface-2 dark:bg-surface-dark">
              <img
                src={selected.thumbnailUrl || selected.imageUrl}
                alt={selected.prompt}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-sans text-sm text-muted dark:text-muted-dark">
                <p className="font-semibold text-ink dark:text-ink-dark">Description</p>
                <p className="truncate text-xs">
                  {selected.revisedPrompt || selected.prompt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const prefill = selected.revisedPrompt || selected.prompt;
                  window.dispatchEvent(
                    new CustomEvent('gptees.quickstart.prefill', { detail: { prompt: prefill } })
                  );
                  window.location.hash = '#quickstart';
                  setSelected(null);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 font-sans text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90 dark:bg-accent-dark"
              >
                Use this idea
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
