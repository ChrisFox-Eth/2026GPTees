/**
 * @module types/gallery
 * @description Types for public design gallery feed.
 * @since 2025-11-21
 */

/**
 * @interface GalleryDesign
 * @description Represents a publicly displayable design in the community gallery feed
 *
 * @property {string} id - Unique identifier for the gallery design entry
 * @property {string} prompt - Original user prompt that generated this design
 * @property {string | null} [revisedPrompt] - AI-revised or enhanced version of the original prompt (optional)
 * @property {string} imageUrl - Full-resolution URL of the design image for gallery display
 * @property {string | null} [thumbnailUrl] - Optimized thumbnail URL for grid/list views (optional)
 * @property {string} createdAt - ISO timestamp when the design was created and added to the gallery
 */
export interface GalleryDesign {
  id: string;
  prompt: string;
  revisedPrompt?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  createdAt: string;
}
