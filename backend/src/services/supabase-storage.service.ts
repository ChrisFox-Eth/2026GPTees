/**
 * @module services/supabase-storage
 * @description Supabase Storage service for design asset upload
 * @since 2025-11-24
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import https from 'https';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_DESIGNS_BUCKET || 'designs';

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

/**
 * Download image from a remote URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        response.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * Upload a buffer to Supabase Storage and return its public URL
 */
async function uploadBuffer(path: string, buffer: Buffer, contentType: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured.');
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  if (!publicUrl?.publicUrl) {
    throw new Error('Unable to generate public URL for uploaded asset.');
  }

  return publicUrl.publicUrl;
}

/**
 * Upload design image (and thumbnail) to Supabase Storage
 * Falls back to returning the original URL if Supabase is not configured.
 */
export async function uploadImage(
  imageUrl: string,
  designId: string
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  if (!supabase) {
    console.warn('Supabase storage not configured, returning original OpenAI URL.');
    return {
      imageUrl,
      thumbnailUrl: imageUrl,
    };
  }

  const timestamp = Date.now();

  const imageBuffer = await downloadImage(imageUrl);
  const optimizedImage = await sharp(imageBuffer).png({ quality: 90 }).toBuffer();
  const thumbnail = await sharp(imageBuffer)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .png({ quality: 80 })
    .toBuffer();

  const imagePath = `${designId}/image-${timestamp}.png`;
  const thumbnailPath = `${designId}/thumbnail-${timestamp}.png`;

  const [uploadedImageUrl, uploadedThumbnailUrl] = await Promise.all([
    uploadBuffer(imagePath, optimizedImage, 'image/png'),
    uploadBuffer(thumbnailPath, thumbnail, 'image/png'),
  ]);

  console.log(`✅ Design ${designId} uploaded to Supabase Storage`);

  return {
    imageUrl: uploadedImageUrl,
    thumbnailUrl: uploadedThumbnailUrl,
  };
}

export default supabase;
