/**
 * @module components/Gallery/Gallery.types
 * @description Type definitions for the component gallery sections used on the homepage showcase.
 * @since 2025-10-29
 */

import React from 'react';

/**
 * Shape of each showcase section in the gallery.
 * @typedef {Object} GallerySection
 * @property {string} title - Heading label for the section.
 * @property {string} description - Short explanation for what the section demonstrates.
 * @property {React.ReactNode} content - The rendered showcase content for the section.
 */
export interface GallerySection {
  title: string;
  description: string;
  content: React.ReactNode;
}
