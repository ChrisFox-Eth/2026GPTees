/**
 * @module types/gallery
 * @description Types for public design gallery feed.
 */

export interface GalleryDesign {
  id: string;
  prompt: string;
  revisedPrompt?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  createdAt: string;
}
