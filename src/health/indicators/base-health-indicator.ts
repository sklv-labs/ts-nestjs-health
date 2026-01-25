import { HealthCheckError } from '../health-error';

import type { HealthIndicator } from '../types/health-indicator.interface';
import type { HealthIndicatorResult, HealthStatus } from '../types/health-result.interface';

/**
 * Abstract base class for health indicators
 * Provides helper methods for creating health results and error handling
 */
export abstract class BaseHealthIndicator implements HealthIndicator {
  /**
   * Unique name of the health indicator
   */
  abstract readonly name: string;

  /**
   * Perform the health check
   *
   * @returns Promise resolving to health indicator result
   */
  abstract check(): Promise<HealthIndicatorResult>;

  /**
   * Create a successful health result
   *
   * @param data - Additional data to include in the result
   * @returns Health indicator result with status 'up'
   */
  protected up(data?: Record<string, unknown>): HealthIndicatorResult {
    return {
      status: 'up',
      ...data,
    };
  }

  /**
   * Create a failed health result
   *
   * @param message - Error message
   * @param data - Additional data to include in the result
   * @returns Health indicator result with status 'down'
   */
  protected down(message: string, data?: Record<string, unknown>): HealthIndicatorResult {
    return {
      status: 'down',
      message,
      ...data,
    };
  }

  /**
   * Create a health result with the given status
   *
   * @param status - Health status
   * @param data - Additional data to include in the result
   * @returns Health indicator result
   */
  protected result(status: HealthStatus, data?: Record<string, unknown>): HealthIndicatorResult {
    return {
      status,
      ...data,
    };
  }

  /**
   * Throw a health check error
   *
   * @param message - Error message
   * @param code - Error code
   * @param metadata - Optional metadata
   * @throws HealthCheckError
   */
  protected throwError(message: string, code?: string, metadata?: Record<string, unknown>): never {
    throw new HealthCheckError(message, code, metadata);
  }

  /**
   * Wrap a promise with timeout handling
   *
   * @param promise - Promise to wrap
   * @param timeout - Timeout in milliseconds
   * @param timeoutMessage - Message to use if timeout occurs
   * @returns Promise that rejects with timeout error if timeout is exceeded
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(HealthCheckError.timeout(timeoutMessage, { timeout }));
        }, timeout);
      }),
    ]);
  }
}
