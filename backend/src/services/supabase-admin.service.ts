/**
 * @module services/supabase-admin
 * @description Supabase service-role client for social ops (server-side only)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../middleware/error.middleware.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn('Supabase service role client is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

/**
 * Get configured Supabase client or throw if missing.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (!supabase) {
    throw new AppError('Supabase service role is not configured', 500);
  }
  return supabase;
}

/**
 * Check if Supabase client is ready.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabase);
}
