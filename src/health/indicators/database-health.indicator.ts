import { Inject, Injectable, Optional } from '@nestjs/common';
import { DRIZZLE_INSTANCE, type DrizzleDatabase } from '@sklv-labs/ts-nestjs-database/drizzle';
import { sql } from 'drizzle-orm';

import { HealthCheckError } from '../health-error';

import { BaseHealthIndicator } from './base-health-indicator';

import type { HealthIndicatorResult } from '../types/health-result.interface';

/**
 * Options for database health indicator
 */
export interface DatabaseHealthIndicatorOptions {
  /**
   * Drizzle database instance (optional if injected via DRIZZLE_INSTANCE)
   */
  instance?: DrizzleDatabase;

  /**
   * Timeout for database connection check in milliseconds
   * @default 5000
   */
  timeout?: number;
}

/**
 * Database health indicator for Drizzle ORM
 * Integrates with @sklv-labs/ts-nestjs-database
 */
@Injectable()
export class DatabaseHealthIndicator extends BaseHealthIndicator {
  readonly name = 'database';

  private readonly db: DrizzleDatabase;
  private readonly timeout: number;

  constructor(
    @Optional() @Inject(DRIZZLE_INSTANCE) drizzleInstance?: DrizzleDatabase,
    options?: DatabaseHealthIndicatorOptions
  ) {
    super();

    // Use provided instance, injected instance, or throw error
    if (options?.instance) {
      this.db = options.instance;
    } else if (drizzleInstance) {
      this.db = drizzleInstance;
    } else {
      throw new Error(
        'DatabaseHealthIndicator: Drizzle instance not found. Either provide instance in options or ensure DrizzleModule is imported.'
      );
    }

    this.timeout = options?.timeout ?? 5000;
  }

  /**
   * Factory method to create database health indicator with explicit instance
   *
   * @param options - Database health indicator options
   * @returns Database health indicator instance
   */
  static forDrizzle(options?: DatabaseHealthIndicatorOptions): DatabaseHealthIndicator {
    return new DatabaseHealthIndicator(undefined, options);
  }

  /**
   * Perform database health check
   *
   * @returns Promise resolving to health indicator result
   */
  async check(): Promise<HealthIndicatorResult> {
    try {
      // Execute a simple query to test connection
      // Use type assertion since execute exists on all Drizzle database types
      const db = this.db as { execute: (query: unknown) => Promise<unknown> };
      await this.withTimeout(
        db.execute(sql`select 1`),
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
