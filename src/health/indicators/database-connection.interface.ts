/**
 * Database connection interface for health checks
 * Provides an abstraction layer that works with any database/ORM
 */
export interface DatabaseConnection {
  /**
   * Execute a health check query
   * This should be a lightweight query that verifies the database connection
   *
   * @param query - The query to execute (can be SQL string, query object, etc.)
   * @returns Promise that resolves when the query completes successfully
   * @throws Error if the database connection is unhealthy
   */
  execute(query: unknown): Promise<unknown>;
}
