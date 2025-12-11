/**
 * @module components/ExamplesGallery
 * @description Small gallery of real designs pulled from Supabase.
 */

import { useEffect, useState } from 'react';
import { apiGet } from '@utils/api';
import type { GalleryDesign } from '../../types/gallery';

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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: LIMIT }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="w-full aspect-square rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      );
    }

    if (!designs.length) {
      return (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          New designs are on the way. Check back soon.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {designs.map((design) => {
          const preview = design.thumbnailUrl || design.imageUrl;
          return (
            <button
              type="button"
              key={design.id}
              onClick={() => setSelected(design)}
              className="relative group focus-visible:outline focus-visible:outline-primary-500 rounded-lg"
            >
              <img
                src={preview}
                alt={design.prompt}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 640px) 30vw, 16vw"
                className="w-full aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <figcaption className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                {design.revisedPrompt || design.prompt}
              </figcaption>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5" id="gallery">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">See what others made</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Live previews from recent designs.</p>
        </div>
      </div>
      {renderContent()}

      {selected && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 dark:border-gray-700 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {selected.revisedPrompt || selected.prompt}
              </p>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <img
                src={selected.thumbnailUrl || selected.imageUrl}
                alt={selected.prompt}
                className="max-h-[70vh] object-contain w-full"
              />
            </div>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 shadow"
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
