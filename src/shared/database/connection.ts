/**
 * Database Connection Pool
 *
 * Provides a PostgreSQL connection pool singleton.
 * This is a SHARED utility - repositories will use this.
 */

import { Pool, QueryResult, QueryResultRow } from "pg";
import { config } from "../config/environment";

/**
 * Create a single connection pool instance
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.isVercel ? 1 : 20, // Use single connection per lambda on Vercel
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: config.isVercel ? { rejectUnauthorized: false } : undefined,
});

/**
 * Handle pool errors
 */
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(-1);
});

/**
 * Database interface
 */
export interface Database {
  query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>>;
  getClient(): Promise<any>;
  end(): Promise<void>;
}

/**
 * Database helper functions
 *
 * This is the ONLY way modules should access the database.
 */
export const db: Database = {
  /**
   * Execute a query with parameters
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    // Log slow queries in development
    if (!config.isProduction && duration > 1000) {
      console.warn("Slow query detected:", {
        duration: `${duration}ms`,
        rows: res.rowCount,
        query: text.substring(0, 100) + "...",
      });
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
