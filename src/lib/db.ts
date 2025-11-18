/**
 * Database client singleton
 *
 * Provides a PostgreSQL connection pool that's reused across the application.
 * This prevents too many database connections.
 */

import { Pool } from 'pg';
import { config } from './config';

// Create a single connection pool instance
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Database helper functions
 */
export const db = {
  /**
   * Execute a query with parameters
   */
  async query(text: string, params?: any[]) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.log('Slow query:', { text, duration, rows: res.rowCount });
    }
    return res;
  },

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    return await pool.connect();
  },

  /**
   * Close the pool (for graceful shutdown)
   */
  async end() {
    await pool.end();
  },
};
