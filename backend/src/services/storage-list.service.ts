/**
 * @module services/storage-list
 * @description List Supabase storage assets for reuse in social posts
 */

import { createClient } from '@supabase/supabase-js';
import { AppError } from '../middleware/error.middleware.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_DESIGNS_BUCKET || 'designs';

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export interface StorageAsset {
  name: string;
  url: string;
  created_at?: string;
  updated_at?: string;
  size?: number;
}

export async function listStorageAssets(
  prefix = '',
  limit = 20,
  offset = 0,
  search?: string,
  type?: 'image' | 'video' | 'gif'
): Promise<StorageAsset[]> {
  if (!supabase) {
    throw new AppError('Supabase storage is not configured', 500);
  }

  /**
   * Supabase storage list is non-recursive. We flatten one level of folders so
   * we return actual file URLs (e.g., social-<id>/image-123.png) instead of folder URLs.
   */
  const listFolder = async (folderPrefix: string): Promise<StorageAsset[]> => {
    const { data, error } = await supabase!.storage.from(bucket).list(folderPrefix, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      throw new AppError(`Failed to list assets: ${error.message}`, 500);
    }

    const results: StorageAsset[] = [];
    for (const item of data) {
      const isFolder = !(item as any).metadata || !(item as any).metadata?.mimetype;
      const path = folderPrefix ? `${folderPrefix}/${item.name}` : item.name;

      if (isFolder) {
        // Drill one level deeper (images are stored under designId folders like social-<id>/image-*.png)
        const children = await listFolder(path);
        results.push(...children);
        continue;
      }

      const { data: publicUrl } = supabase!.storage.from(bucket).getPublicUrl(path);
      results.push({
        name: path,
        url: publicUrl.publicUrl,
        created_at: (item as any).created_at,
        updated_at: (item as any).updated_at,
        size: (item as any).size,
      });
    }
    return results;
  };

  const all = await listFolder(prefix);

  const filtered = all.filter((item) => {
    const name = item.name.toLowerCase();
    const passesSearch = search ? name.includes(search.toLowerCase()) : true;
    const ext = name.split('.').pop() || '';
    const isVideo = ['mp4', 'mov', 'webm', 'mkv'].includes(ext);
    const isGif = ext === 'gif';
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext);
    const passesType =
      !type ||
      (type === 'video' && isVideo) ||
      (type === 'gif' && isGif) ||
      (type === 'image' && isImage);
    return passesSearch && passesType;
  });

  return filtered.slice(offset, offset + limit);
}
