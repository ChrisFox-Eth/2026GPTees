/**
 * @module config/database
 * @description Database configuration and Prisma client instance
 * @since 2025-11-21
 */

import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with logging in development
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

/**
 * Connect to the database
 * @returns {Promise<void>}
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from the database
 * @returns {Promise<void>}
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('✓ Database disconnected');
}

/**
 * Get Prisma client instance
 * @returns {PrismaClient}
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;
