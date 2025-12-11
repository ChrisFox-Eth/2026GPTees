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
            <figure key={design.id} className="relative group">
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
            </figure>
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
    </div>
  );
}
