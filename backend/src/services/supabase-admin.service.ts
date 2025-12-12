/**
 * @module services/supabase-admin
 * @description Supabase service-role client for privileged server-side operations. Provides admin-level access for social operations, bypassing row-level security. Server-side only - never expose to client.
 * @since 2025-11-21
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
 * @function getSupabaseServiceRoleClient
 * @description Returns configured Supabase service role client with admin privileges. Bypasses row-level security for server-side operations.
 *
 * @returns {SupabaseClient} Supabase client with service role permissions
 *
 * @throws {AppError} When Supabase is not configured (500 error)
 *
 * @example
 * const supabase = getSupabaseServiceRoleClient();
 * const { data } = await supabase.from('table').select('*');
 */
export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (!supabase) {
    throw new AppError('Supabase service role is not configured', 500);
  }
  return supabase;
}

/**
 * @function isSupabaseConfigured
 * @description Checks if Supabase service role client is configured and ready to use.
 *
 * @returns {boolean} True if Supabase is configured, false otherwise
 *
 * @example
 * if (isSupabaseConfigured()) {
 *   const client = getSupabaseServiceRoleClient();
 * }
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabase);
}
