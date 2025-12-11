/**
 * @module services/clerk
 * @description Clerk authentication service
 * @since 2025-11-21
 */

import { clerkClient } from '@clerk/clerk-sdk-node';
import { Webhook } from 'svix';
import prisma from '../config/database.js';

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
 * Sync Clerk user to database
 * @param {any} clerkUser - Clerk user object
 * @returns {Promise<any>} Created/updated user
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
 * Get user from database by Clerk ID
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<any>} User from database
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
 * Verify Clerk webhook signature
 * @param {any} payload - Webhook payload
 * @param {any} headers - Request headers
 * @returns {any} Verified webhook event
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
 * Get Clerk user by ID
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<any>} Clerk user object
 */
export async function getClerkUser(clerkId: string) {
  return await clerkClient.users.getUser(clerkId);
}
