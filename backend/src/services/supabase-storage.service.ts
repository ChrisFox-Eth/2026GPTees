/**
 * @module services/supabase-storage
 * @description Supabase Storage service for design asset upload and optimization. Handles image downloading from OpenAI, optimization with Sharp, thumbnail generation, and upload to Supabase Storage bucket.
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
 * @function downloadImage
 * @description Downloads image from remote URL using HTTPS. Used to fetch AI-generated images from OpenAI.
 *
 * @param {string} url - Image URL to download
 *
 * @returns {Promise<Buffer>} Downloaded image as buffer
 *
 * @throws {Error} When download fails or connection error occurs
 *
 * @async
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
 * @function uploadBuffer
 * @description Uploads buffer to Supabase Storage bucket and returns public URL. Uses upsert to allow overwriting existing files.
 *
 * @param {string} path - Storage path within bucket (e.g., 'designId/image.png')
 * @param {Buffer} buffer - Image buffer to upload
 * @param {string} contentType - MIME type (e.g., 'image/png')
 *
 * @returns {Promise<string>} Public URL to uploaded file
 *
 * @throws {Error} When Supabase Storage is not configured
 * @throws {Error} When upload fails
 * @throws {Error} When public URL generation fails
 *
 * @async
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
 * @function uploadImage
 * @description Downloads AI-generated design from OpenAI, optimizes it with Sharp, generates thumbnail, and uploads both to Supabase Storage. Falls back to returning original URL if Supabase not configured.
 *
 * @param {string} imageUrl - OpenAI image URL to download and upload
 * @param {string} designId - Design ID for storage path organization
 *
 * @returns {Promise<{imageUrl: string, thumbnailUrl: string}>} Uploaded image URLs
 * @returns {string} imageUrl - Public URL to full-size optimized image (or original if Supabase not configured)
 * @returns {string} thumbnailUrl - Public URL to 400x400 thumbnail (or original if Supabase not configured)
 *
 * @example
 * const urls = await uploadImage('https://openai.com/temp/image.png', 'design-123');
 * console.log(urls.imageUrl); // 'https://storage.supabase.com/.../design-123/image-1234.png'
 * console.log(urls.thumbnailUrl); // 'https://storage.supabase.com/.../design-123/thumbnail-1234.png'
 *
 * @async
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
