/**
 * @module config/database
 * @description Database configuration and Prisma client instance
 * @since 2025-11-21
 */

import { PrismaClient } from '@prisma/client';

/**
 * @constant prisma
 * @description Singleton Prisma client instance with environment-based logging
 * Development: logs all queries, info, warnings, and errors
 * Production: logs errors only
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

/**
 * @function connectDatabase
 * @description Establishes connection to PostgreSQL database via Prisma
 *
 * @returns {Promise<void>}
 * @throws {Error} Database connection failed
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
 * @function disconnectDatabase
 * @description Gracefully disconnects from PostgreSQL database
 *
 * @returns {Promise<void>}
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('✓ Database disconnected');
}

/**
 * @function getPrismaClient
 * @description Returns singleton Prisma client instance
 *
 * @returns {PrismaClient} Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;
