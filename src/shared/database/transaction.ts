/**
 * Transaction Wrapper
 *
 * Provides transaction support for multi-step database operations.
 * This solves the problem in fixtures-importer.ts where multiple queries
 * are executed without transaction safety.
 */

import { db } from "./connection";

/**
 * Execute multiple operations within a transaction
 *
 * @param callback - Async function that receives a database client
 * @returns Result of the callback
 *
 * @example
 * ```typescript
 * await withTransaction(async (client) => {
 *   await client.query('INSERT INTO clubs ...');
 *   await client.query('INSERT INTO fixtures ...');
 *   // Both succeed or both rollback
 * });
 * ```
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
