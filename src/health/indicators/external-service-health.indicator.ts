import { Injectable } from '@nestjs/common';
import { HttpHealthIndicator } from '@nestjs/terminus';

import { HealthCheckError } from '../health-error';

import { BaseHealthIndicator } from './base-health-indicator';

import type { HealthIndicatorResult } from '../types/health-result.interface';

/**
 * Options for external service health indicator
 */
export interface ExternalServiceHealthIndicatorOptions {
  /**
   * HTTP health indicator instance (from @nestjs/terminus)
   */
  httpHealthIndicator: HttpHealthIndicator;

  /**
   * URL to check
   */
  url: string;

  /**
   * Expected HTTP status code
   * @default 200
   */
  expectedStatusCode?: number;

  /**
   * Timeout for HTTP request in milliseconds
   * @default 5000
   */
  timeout?: number;
}

/**
 * External service health indicator
 * Wraps Terminus HttpHealthIndicator functionality
 */
@Injectable()
export class ExternalServiceHealthIndicator extends BaseHealthIndicator {
  readonly name = 'external-service';

  private readonly httpHealthIndicator: HttpHealthIndicator;
  private readonly url: string;
  private readonly timeout: number;

  constructor(options: ExternalServiceHealthIndicatorOptions) {
    super();
    this.httpHealthIndicator = options.httpHealthIndicator;
    this.url = options.url;
    this.timeout = options.timeout ?? 5000;
  }

  /**
   * Factory method to create external service health indicator for a single URL
   *
   * @param httpHealthIndicator - HTTP health indicator instance
   * @param url - URL to check
   * @param options - Optional configuration
   * @returns External service health indicator instance
   */
  static forUrl(
    httpHealthIndicator: HttpHealthIndicator,
    url: string,
    options?: Omit<ExternalServiceHealthIndicatorOptions, 'httpHealthIndicator' | 'url'>
  ): ExternalServiceHealthIndicator {
    return new ExternalServiceHealthIndicator({
      httpHealthIndicator,
      url,
      ...options,
    });
  }

  /**
   * Perform external service health check
   *
   * @returns Promise resolving to health indicator result
   */
  async check(): Promise<HealthIndicatorResult> {
    try {
      const result = await this.withTimeout(
        this.httpHealthIndicator.pingCheck('external-service', this.url, {
          timeout: this.timeout,
        }),
        this.timeout,
        `External service health check timed out after ${this.timeout}ms`
      );

      const serviceResult = (result as Record<string, { status: string; [key: string]: unknown }>)[
        'external-service'
      ];

      if (serviceResult.status === 'down') {
        return this.down('External service is not responding', {
          url: this.url,
          result: serviceResult,
        });
      }

      return this.up({
        message: 'External service is healthy',
        url: this.url,
        result: serviceResult,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'External service check failed';

      throw HealthCheckError.externalService(errorMessage, {
        indicator: this.name,
        url: this.url,
        timeout: this.timeout,
        error: errorMessage,
      });
    }
  }
}
