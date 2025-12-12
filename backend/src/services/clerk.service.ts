/**
 * @module services/clerk
 * @description Clerk authentication service for user management, webhook verification, and database synchronization. Handles user creation, updates, and authentication integration with Clerk.
 * @since 2025-11-21
 */

import { clerkClient } from '@clerk/clerk-sdk-node';
import { Webhook } from 'svix';
import prisma from '../config/database.js';

/**
 * @function resolveFallbackEmail
 * @description Resolves and normalizes email address from various Clerk user data formats. Generates a fallback email using Clerk ID if no valid email is found.
 *
 * @param {any} candidate - Email candidate from Clerk (can be string, array, or object)
 * @param {string} [clerkId] - Clerk user ID for generating fallback email
 *
 * @returns {string} Resolved email address or fallback email
 *
 * @example
 * const email = resolveFallbackEmail(user.email_addresses, user.id);
 */
function resolveFallbackEmail(candidate: any, clerkId?: string): string {
  if (!candidate && clerkId) {
    return `${clerkId}@noemail.clerk.local`;
  }
  if (typeof candidate === 'string') {
    return candidate;
  }
  if (Array.isArray(candidate)) {
    const first = candidate[0];
    if (!first) return clerkId ? `${clerkId}@noemail.clerk.local` : 'noemail@clerk.local';
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && (first as any).email_address) return (first as any).email_address;
    if (typeof first === 'object' && (first as any).email) return (first as any).email;
  }
  if (typeof candidate === 'object' && candidate !== null) {
    if ((candidate as any).email_address) return (candidate as any).email_address;
    if ((candidate as any).email) return (candidate as any).email;
  }
  return clerkId ? `${clerkId}@noemail.clerk.local` : 'noemail@clerk.local';
}

/**
 * @function syncUserToDatabase
 * @description Synchronizes Clerk user data to the application database. Creates a new user if they don't exist, or updates existing user information. Uses upsert to ensure idempotency.
 *
 * @param {any} clerkUser - Clerk user object containing user data
 * @param {string} clerkUser.id - Clerk user ID (primary identifier)
 * @param {Array} clerkUser.email_addresses - Array of email address objects
 * @param {string} [clerkUser.first_name] - User's first name
 * @param {string} [clerkUser.last_name] - User's last name
 * @param {string} [fallbackEmail] - Optional fallback email if user has no email in Clerk
 *
 * @returns {Promise<any>} Created or updated user record from database
 *
 * @throws {Error} When database operation fails
 *
 * @example
 * const user = await syncUserToDatabase(clerkUser);
 *
 * @async
 */
export async function syncUserToDatabase(clerkUser: any, fallbackEmail?: string) {
  const { id: clerkId, email_addresses, first_name, last_name } = clerkUser || {};

  const email =
    email_addresses?.[0]?.email_address ||
    resolveFallbackEmail(fallbackEmail, clerkId);

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {
      email,
      firstName: first_name || null,
      lastName: last_name || null,
    },
    create: {
      clerkId,
      email,
      firstName: first_name || null,
      lastName: last_name || null,
    },
  });

  return user;
}

/**
 * @function getUserByClerkId
 * @description Retrieves user from database by their Clerk ID. Includes related addresses in the response.
 *
 * @param {string} clerkId - Clerk user ID to look up
 *
 * @returns {Promise<any>} User record with addresses, or null if not found
 *
 * @example
 * const user = await getUserByClerkId('user_123abc');
 *
 * @async
 */
export async function getUserByClerkId(clerkId: string) {
  return await prisma.user.findUnique({
    where: { clerkId },
    include: {
      addresses: true,
    },
  });
}

/**
 * @function verifyClerkWebhook
 * @description Verifies the cryptographic signature of a Clerk webhook using Svix. Ensures the webhook request is authentic and hasn't been tampered with.
 *
 * @param {string} payload - Raw webhook payload body (must be string, not parsed JSON)
 * @param {any} headers - HTTP request headers containing Svix signature headers
 *
 * @returns {any} Verified webhook event data
 *
 * @throws {Error} When CLERK_WEBHOOK_SECRET is not configured
 * @throws {Error} When webhook signature verification fails
 *
 * @example
 * const event = verifyClerkWebhook(req.body, req.headers);
 */
export function verifyClerkWebhook(payload: string, headers: any) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

  const wh = new Webhook(webhookSecret);
  // Payload is already a string from the controller, don't stringify again
  return wh.verify(payload, headers);
}

/**
 * @function getClerkUser
 * @description Fetches full user data from Clerk API by user ID. Used to retrieve the latest user information directly from Clerk.
 *
 * @param {string} clerkId - Clerk user ID
 *
 * @returns {Promise<any>} Clerk user object with complete user data
 *
 * @throws {Error} When Clerk API request fails
 *
 * @example
 * const clerkUser = await getClerkUser('user_123abc');
 *
 * @async
 */
export async function getClerkUser(clerkId: string) {
  return await clerkClient.users.getUser(clerkId);
}
