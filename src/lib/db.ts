/**
 * Database client singleton
 *
 * Provides a single PrismaClient instance that's reused across the application.
 * This prevents too many database connections in development.
 */

import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma client in development
// This prevents hot-reloading from creating multiple instances
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a single PrismaClient instance
export const prisma = global.prisma || new PrismaClient({
  log: ['error', 'warn'],
});

// In development, store the client globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
