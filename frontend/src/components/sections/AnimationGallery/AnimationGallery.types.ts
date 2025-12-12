/**
 * @module components/sections/AnimationGallery/types
 * @description Supporting types for the AnimationGallery component
 * @since 2025-11-21
 */

import React from 'react';

/**
 * Configuration for a single animation demonstration section in the gallery
 * @interface AnimationGallerySection
 * @property {string} title - Section heading displayed above the demo
 * @property {string} description - Short blurb describing the showcased animation technique
 * @property {React.ReactNode} content - Renderable content demonstrating the animation
 */
export interface AnimationGallerySection {
  /** Section heading displayed above the demo */
  title: string;
  /** Short blurb describing the showcased animation technique */
  description: string;
  /** Renderable content demonstrating the animation */
  content: React.ReactNode;
}
