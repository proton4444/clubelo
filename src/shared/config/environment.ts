/**
 * Environment Configuration
 *
 * Centralized configuration loading with validation.
 * This is a SHARED utility - no business logic allowed here.
 */

import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Application configuration object
 */
export const config = {
  // Database connection string (required)
  // Vercel Postgres uses POSTGRES_URL by default
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",

  // ClubElo API base URL (no trailing slash)
  clubeloApiBase: process.env.CLUBELO_API_BASE || "http://api.clubelo.com",

  // API server port (default to 3001 for local dev; override via PORT)
  port: parseInt(process.env.PORT || "3001", 10),

  // HTTP request timeout (in milliseconds)
  httpTimeout: parseInt(process.env.HTTP_TIMEOUT || "120000", 10),

  // Maximum retries for HTTP requests
  httpMaxRetries: parseInt(process.env.HTTP_MAX_RETRIES || "3", 10),

  // Cron secret for protected endpoints
  cronSecret: process.env.CRON_SECRET || "",

  // Environment
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isVercel: !!process.env.VERCEL,
  isTest: process.env.NODE_ENV === "test",
} as const;

/**
 * Validate required configuration
 */
function validateConfig() {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (config.isProduction && !config.cronSecret) {
    console.warn("WARNING: CRON_SECRET not set in production environment");
  }
}

// Run validation on module load
validateConfig();
