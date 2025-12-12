/**
 * @module components/ui/ImagePlaceholder
 * @description Placeholder component for images pending final photography.
 * Maintains aspect ratio and provides visual indication of intended content.
 * @since 2025-12-11
 */

import { cn } from '@utils/cn';

/**
 * @interface ImagePlaceholderProps
 * @description Props for the ImagePlaceholder component
 */
export interface ImagePlaceholderProps {
  /** Aspect ratio as "width/height" (e.g., "16/9", "4/5", "1/1") */
  aspectRatio?: '16/9' | '4/5' | '1/1' | '3/4' | '9/16';
  /** Optional label describing what image should go here */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility (describes intended image) */
  alt?: string;
}

/**
 * @component ImagePlaceholder
 * @description Renders a styled placeholder for images that are pending.
 * Shows aspect ratio, maintains layout, and optionally displays a label.
 *
 * @param {ImagePlaceholderProps} props - Component props
 * @returns {JSX.Element} Placeholder div with aspect ratio preserved
 *
 * @example
 * <ImagePlaceholder aspectRatio="16/9" label="Hero lifestyle shot" />
 * <ImagePlaceholder aspectRatio="4/5" label="Lookbook image" />
 */
export function ImagePlaceholder({
  aspectRatio = '16/9',
  label,
  className,
  alt,
}: ImagePlaceholderProps): JSX.Element {
  const aspectClasses: Record<string, string> = {
    '16/9': 'aspect-video',
    '4/5': 'aspect-[4/5]',
    '1/1': 'aspect-square',
    '3/4': 'aspect-[3/4]',
    '9/16': 'aspect-[9/16]',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-surface-2 dark:bg-surface-dark',
        'border border-dashed border-muted/30 dark:border-muted-dark/30',
        aspectClasses[aspectRatio],
        className
      )}
      role="img"
      aria-label={alt || label || 'Image placeholder'}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        {/* Camera icon */}
        <svg
          className="mb-2 h-8 w-8 text-muted/40 dark:text-muted-dark/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {label && (
          <span className="text-sm text-muted/60 dark:text-muted-dark/60">{label}</span>
        )}
      </div>
    </div>
  );
}

export default ImagePlaceholder;
