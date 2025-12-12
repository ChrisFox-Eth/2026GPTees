/**
 * @module components/sections/Gallery/types
 * @description Type definitions for the component gallery sections used on the homepage showcase
 * @since 2025-11-21
 */

import React from 'react';

/**
 * Configuration for a single UI component showcase section in the gallery
 * @interface GallerySection
 * @property {string} title - Heading label for the section
 * @property {string} description - Short explanation for what the section demonstrates
 * @property {React.ReactNode} content - The rendered showcase content for the section
 */
export interface GallerySection {
  /** Heading label for the section */
  title: string;
  /** Short explanation for what the section demonstrates */
  description: string;
  /** The rendered showcase content for the section */
  content: React.ReactNode;
}

/**
 * Row data shape for the team table example in the gallery
 * @interface TeamMemberRow
 * @property {string} name - Team member's full name
 * @property {string} role - Team member's role or position
 * @property {string} status - Current status (e.g., "Online", "Away")
 */
export interface TeamMemberRow {
  /** Index signature to satisfy generic TableRow constraint */
  [key: string]: unknown;
  /** Team member's full name */
  name: string;
  /** Team member's role or position */
  role: string;
  /** Current status (e.g., "Online", "Away") */
  status: string;
}
