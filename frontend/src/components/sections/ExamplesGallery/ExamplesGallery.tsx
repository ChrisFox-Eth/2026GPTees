/**
 * @module components/sections/ExamplesGallery
 * @description Small gallery of real designs pulled from Supabase to showcase community creations
 * @since 2025-11-21
 */

/**
 * @component
 * @description Fetches and displays a grid gallery of real user-generated designs from the API.
 * Features loading skeletons, error handling, clickable thumbnails with modal preview, and the
 * ability to use any design's prompt in the Quickstart component. Shows up to 24 recent designs.
 *
 * @returns {JSX.Element} Gallery grid with design thumbnails and modal for detailed view
 *
 * @example
 * <ExamplesGallery />
 */

import { useEffect, useState } from 'react';
import { apiGet } from '@utils/api';
import type { GalleryDesign } from '../../../types/gallery';

const LIMIT = 24;

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
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: LIMIT }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="aspect-square w-full animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return <div className="text-sm text-red-600 dark:text-red-400">{error}</div>;
    }

    if (!designs.length) {
      return (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          New designs are on the way. Check back soon.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {designs.map((design) => {
          const preview = design.thumbnailUrl || design.imageUrl;
          return (
            <button
              type="button"
              key={design.id}
              onClick={() => setSelected(design)}
              className="group focus-visible:outline-primary-500 relative rounded-lg focus-visible:outline"
            >
              <img
                src={preview}
                alt={design.prompt}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 30vw, 16vw"
                className="aspect-square w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
              />
              <figcaption className="absolute right-1 bottom-1 left-1 line-clamp-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {design.revisedPrompt || design.prompt}
              </figcaption>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-800"
      id="gallery"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            See what others made
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Live previews from recent designs.
          </p>
        </div>
      </div>
      {renderContent()}

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {selected.revisedPrompt || selected.prompt}
              </p>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <img
                src={selected.thumbnailUrl || selected.imageUrl}
                alt={selected.prompt}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold">Prompt</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
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
                className="bg-primary-600 hover:bg-primary-700 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow"
              >
                Use this prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
