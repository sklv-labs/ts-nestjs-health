import { sql } from 'drizzle-orm';

import type { DatabaseConnection } from './database-connection.interface';

/**
 * Creates a DatabaseConnection adapter for Drizzle ORM
 * This allows the DatabaseHealthIndicator to work with Drizzle instances
 *
 * @param drizzleInstance - Drizzle database instance (must have execute method)
 * @returns DatabaseConnection adapter
 *
 * @example
 * ```typescript
 * import { createDrizzleConnection } from '@sklv-labs/ts-nestjs-health';
 *
 * const connection = createDrizzleConnection(drizzleInstance);
 * const indicator = new DatabaseHealthIndicator({
 *   connection,
 *   name: 'primary-db',
 * });
 * ```
 */
export function createDrizzleConnection(drizzleInstance: {
  execute: (query: unknown) => Promise<unknown>;
}): DatabaseConnection {
  return {
    execute: (query: unknown) => {
      // If query is already a Drizzle SQL object, use it directly
      // Otherwise, use a default health check query
      const healthCheckQuery = query ?? sql`SELECT 1`;
      return drizzleInstance.execute(healthCheckQuery);
    },
  };
}
