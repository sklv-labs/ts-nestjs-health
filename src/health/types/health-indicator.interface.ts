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
   * Whether this indicator is critical for overall health
   * If true, failure of this indicator will cause overall health to be 'down'
   * @default true
   */
  critical?: boolean;

  /**
   * Perform the health check
   *
   * @returns Promise resolving to health indicator result
   */
  check(): Promise<HealthIndicatorResult>;
}
