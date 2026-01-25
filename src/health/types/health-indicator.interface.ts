import type { HealthIndicatorResult } from './health-result.interface';

/**
 * Base interface for health indicators
 */
export interface HealthIndicator {
  /**
   * Unique name of the health indicator
   */
  name: string;

  /**
   * Perform the health check
   *
   * @returns Promise resolving to health indicator result
   */
  check(): Promise<HealthIndicatorResult>;
}
