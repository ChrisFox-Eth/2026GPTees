/**
 * @module components/AnimationGallery/AnimationGallery.types
 * @description Supporting types for the AnimationGallery component.
 * @since 2025-10-29
 */

import React from 'react';

/**
 * Defines a section rendered in the animation gallery.
 */
export interface AnimationGallerySection {
  /** Section heading. */
  title: string;
  /** Short blurb describing the showcased animation. */
  description: string;
  /** Renderable content demonstrating the animation. */
  content: React.ReactNode;
}
