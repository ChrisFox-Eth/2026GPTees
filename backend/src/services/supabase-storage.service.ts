/**
 * @module services/supabase-storage
 * @description Supabase Storage service for image upload
 * @since 2025-11-24
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import https from 'https';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'designs';

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Generate thumbnail from image buffer
 */
async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType,
      upsert: true,
      cacheControl: '31536000', // 1 year cache
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Upload image from URL to Supabase Storage
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  designId: string
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  console.log('📥 Downloading image from OpenAI...');
  const imageBuffer = await downloadImage(imageUrl);

  console.log('🖼️  Generating thumbnail...');
  const thumbnailBuffer = await generateThumbnail(imageBuffer);

  const timestamp = Date.now();
  const imagePath = `designs/${designId}/image-${timestamp}.jpg`;
  const thumbnailPath = `designs/${designId}/thumbnail-${timestamp}.jpg`;

  console.log('☁️  Uploading to Supabase Storage...');

  const [uploadedImageUrl, uploadedThumbnailUrl] = await Promise.all([
    uploadToSupabase(imageBuffer, imagePath),
    uploadToSupabase(thumbnailBuffer, thumbnailPath),
  ]);

  console.log('✅ Images uploaded to Supabase Storage');

  return {
    imageUrl: uploadedImageUrl,
    thumbnailUrl: uploadedThumbnailUrl,
  };
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey);
}

/**
 * Upload with automatic storage selection (Supabase or S3 fallback)
 */
export async function uploadImageWithFallback(
  imageUrl: string,
  designId: string,
  s3Upload: (url: string, id: string) => Promise<{ imageUrl: string; thumbnailUrl: string }>
): Promise<{ imageUrl: string; thumbnailUrl: string; storage: string }> {
  // Try Supabase first if configured
  if (isSupabaseConfigured()) {
    try {
      const result = await uploadImageToSupabase(imageUrl, designId);
      return { ...result, storage: 'supabase' };
    } catch (error) {
      console.error('⚠️  Supabase upload failed, trying S3 fallback:', error);
    }
  }

  // Fallback to S3
  try {
    const result = await s3Upload(imageUrl, designId);
    return { ...result, storage: 's3' };
  } catch (error) {
    console.error('❌ All storage options failed, using temporary OpenAI URL');
    // Last resort: return OpenAI URL (will expire in 1 hour)
    return {
      imageUrl,
      thumbnailUrl: imageUrl,
      storage: 'temporary',
    };
  }
}
