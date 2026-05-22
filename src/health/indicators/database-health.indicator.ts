import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { HealthCheckError } from '../health-error';

import { BaseHealthIndicator } from './base-health-indicator';

import type { DatabaseConnection } from './database-connection.interface';
import type { HealthIndicatorResult } from '../types/health-result.interface';

/**
 * Options for database health indicator
 */
export interface DatabaseHealthIndicatorOptions {
  /**
   * Database connection to check
   */
  connection: DatabaseConnection;

  /**
   * Unique name for this database indicator
   * Allows multiple database indicators with different names
   * @default 'database'
   */
  name?: string;

  /**
   * Whether this indicator is critical for overall health
   * @default true
   */
  critical?: boolean;

  /**
   * Timeout for database connection check in milliseconds
   * @default 5000
   */
  timeout?: number;

  /**
   * Custom health check query
   * If not provided, a simple connection test will be performed
   * The format depends on the database connection implementation
   */
  query?: unknown;
}

/**
 * Database health indicator
 * Works with any database/ORM through the DatabaseConnection interface
 *
 * @example
 * ```typescript
 * // Using factory method for Drizzle
 * const indicator = DatabaseHealthIndicator.forDrizzle(drizzleInstance, {
 *   name: 'primary-db',
 *   timeout: 3000,
 * });
 *
 * // Using with custom connection
 * const indicator = new DatabaseHealthIndicator({
 *   connection: myCustomConnection,
 *   name: 'custom-db',
 * });
 * ```
 */
@Injectable()
export class DatabaseHealthIndicator extends BaseHealthIndicator {
  readonly name: string;
  readonly critical: boolean;

  private readonly connection: DatabaseConnection;
  private readonly timeout: number;
  private readonly query: unknown;

  constructor(options: DatabaseHealthIndicatorOptions) {
    super();

    if (!options.connection) {
      throw new Error('Database connection is required');
    }

    this.connection = options.connection;
    this.name = options.name ?? 'database';
    this.critical = options.critical ?? true;
    this.timeout = options.timeout ?? 5000;
    this.query = options.query;
  }

  /**
   * Factory method to create a database health indicator for Drizzle ORM
   *
   * @param drizzleInstance - Drizzle database instance (must have execute method)
   * @param options - Optional configuration
   * @returns Database health indicator instance
   *
   * @example
   * ```typescript
   * import { sql } from 'drizzle-orm';
   *
   * const indicator = DatabaseHealthIndicator.forDrizzle(drizzleInstance, {
   *   name: 'primary-db',
   *   timeout: 3000,
   *   query: sql`SELECT 1`,
   * });
   * ```
   */
  static forDrizzle(
    drizzleInstance: { execute: (query: unknown) => Promise<unknown> },
    options?: Omit<DatabaseHealthIndicatorOptions, 'connection'>
  ): DatabaseHealthIndicator {
    // Default to using Drizzle's sql template for health check
    const defaultQuery = sql`SELECT 1`;

    return new DatabaseHealthIndicator({
      connection: {
        execute: (query) => {
          // Use provided query or default to SELECT 1
          const healthCheckQuery = query ?? defaultQuery;
          return drizzleInstance.execute(healthCheckQuery);
        },
      },
      // Use default query if none provided
      query: options?.query ?? defaultQuery,
      ...options,
    });
  }

  /**
   * Perform database health check
   *
   * @returns Promise resolving to health indicator result
   */
  async check(): Promise<HealthIndicatorResult> {
    try {
      // Use custom query if provided, otherwise use a simple connection test
      const query = this.query ?? 'SELECT 1';

      await this.withTimeout(
        this.connection.execute(query),
        this.timeout,
        `Database health check timed out after ${this.timeout}ms`
      );

      return this.up({
        message: 'Database connection is healthy',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database connection failed';

      throw HealthCheckError.database(errorMessage, {
        indicator: this.name,
        timeout: this.timeout,
        error: errorMessage,
      });
    }
  }
}
