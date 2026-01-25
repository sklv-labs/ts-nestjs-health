import { Injectable } from '@nestjs/common';

import { HealthCheckError } from '../health-error';

import { BaseHealthIndicator } from './base-health-indicator';

import type { HealthIndicatorResult } from '../types/health-result.interface';

/**
 * Options for Redis health indicator
 */
export interface RedisHealthIndicatorOptions {
  /**
   * Redis client instance (ioredis or redis)
   */
  client: {
    ping: () => Promise<string>;
    status?: string;
    connected?: boolean;
  };

  /**
   * Timeout for Redis connection check in milliseconds
   * @default 5000
   */
  timeout?: number;
}

/**
 * Redis health indicator
 */
@Injectable()
export class RedisHealthIndicator extends BaseHealthIndicator {
  readonly name = 'redis';

  private readonly client: RedisHealthIndicatorOptions['client'];
  private readonly timeout: number;

  constructor(options: RedisHealthIndicatorOptions) {
    super();
    this.client = options.client;
    this.timeout = options.timeout ?? 5000;
  }

  /**
   * Factory method to create Redis health indicator with connection
   *
   * @param options - Redis health indicator options
   * @returns Redis health indicator instance
   */
  static forConnection(options: RedisHealthIndicatorOptions): RedisHealthIndicator {
    return new RedisHealthIndicator(options);
  }

  /**
   * Perform Redis health check
   *
   * @returns Promise resolving to health indicator result
   */
  async check(): Promise<HealthIndicatorResult> {
    try {
      // Check connection status if available
      if (this.client.status !== undefined && this.client.status !== 'ready') {
        return this.down(`Redis connection status: ${this.client.status}`);
      }

      if (this.client.connected !== undefined && !this.client.connected) {
        return this.down('Redis client is not connected');
      }

      // Perform ping check
      const response = await this.withTimeout(
        this.client.ping(),
        this.timeout,
        `Redis health check timed out after ${this.timeout}ms`
      );

      if (response !== 'PONG') {
        return this.down(`Unexpected Redis ping response: ${response}`);
      }

      return this.up({
        message: 'Redis connection is healthy',
        response,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Redis connection failed';

      throw HealthCheckError.redis(errorMessage, {
        indicator: this.name,
        timeout: this.timeout,
        error: errorMessage,
      });
    }
  }
}
