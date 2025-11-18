/**
 * Application configuration
 *
 * Loads configuration from environment variables with sensible defaults.
 * Make sure to create a .env file based on .env.example
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Database connection string (required)
  databaseUrl: process.env.DATABASE_URL || '',

  // ClubElo API base URL (no trailing slash)
  clubeloApiBase: process.env.CLUBELO_API_BASE || 'http://api.clubelo.com',

  // API server port
  port: parseInt(process.env.PORT || '3000', 10),

  // HTTP request timeout (in milliseconds)
  httpTimeout: 30000,

  // Maximum retries for HTTP requests
  httpMaxRetries: 3,
};

// Validate required configuration
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}
