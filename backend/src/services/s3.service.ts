/**
 * @module services/s3
 * @description AWS S3 service for image upload and storage
 * @since 2025-11-21
 */

import AWS from 'aws-sdk';
import sharp from 'sharp';
import https from 'https';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-2',
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

/**
 * Download image from URL
 * @param {string} url - Image URL
 * @returns {Promise<Buffer>} Image buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];

      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Generate thumbnail from image buffer
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} Thumbnail buffer
 */
async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * Upload image to S3
 * @param {Buffer} buffer - Image buffer
 * @param {string} key - S3 object key (file path)
 * @param {string} contentType - Content type
 * @returns {Promise<string>} S3 URL
 */
async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME not configured');
  }

  const params: AWS.S3.PutObjectRequest = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  };

  await s3.putObject(params).promise();

  // Return S3 URL
  return `https://${BUCKET_NAME}.s3.${AWS.config.region}.amazonaws.com/${key}`;
}

/**
 * Upload image from URL to S3
 * @param {string} imageUrl - Source image URL
 * @param {string} designId - Design ID for file naming
 * @returns {Promise<{imageUrl: string, thumbnailUrl: string}>} S3 URLs
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  designId: string
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  console.log('Downloading image from OpenAI...');
  const imageBuffer = await downloadImage(imageUrl);

  console.log('Generating thumbnail...');
  const thumbnailBuffer = await generateThumbnail(imageBuffer);

  const timestamp = Date.now();
  const imageKey = `designs/${designId}/image-${timestamp}.jpg`;
  const thumbnailKey = `designs/${designId}/thumbnail-${timestamp}.jpg`;

  console.log('Uploading to S3...');

  const [uploadedImageUrl, uploadedThumbnailUrl] = await Promise.all([
    uploadToS3(imageBuffer, imageKey),
    uploadToS3(thumbnailBuffer, thumbnailKey),
  ]);

  console.log('✓ Images uploaded to S3');

  return {
    imageUrl: uploadedImageUrl,
    thumbnailUrl: uploadedThumbnailUrl,
  };
}

/**
 * Local fallback for development (when S3 is not configured)
 * @param {string} imageUrl - Source image URL
 * @param {string} designId - Design ID
 * @returns {Promise<{imageUrl: string, thumbnailUrl: string}>} Original URLs
 */
export async function localFallback(
  imageUrl: string,
  _designId: string
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  console.log('⚠️  S3 not configured, using local fallback (OpenAI URLs)');

  // In development, just return the OpenAI URLs
  // They expire after 1 hour, but good enough for testing
  return {
    imageUrl,
    thumbnailUrl: imageUrl, // Same URL for thumbnail in fallback
  };
}

/**
 * Upload image with automatic fallback
 * @param {string} imageUrl - Source image URL
 * @param {string} designId - Design ID
 * @returns {Promise<{imageUrl: string, thumbnailUrl: string}>} Storage URLs
 */
export async function uploadImage(
  imageUrl: string,
  designId: string
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  // Check if S3 is configured
  if (!BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
    return await localFallback(imageUrl, designId);
  }

  try {
    return await uploadImageFromUrl(imageUrl, designId);
  } catch (error) {
    console.error('S3 upload failed, using fallback:', error);
    return await localFallback(imageUrl, designId);
  }
}

export default s3;
