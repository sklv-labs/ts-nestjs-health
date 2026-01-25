/**
 * Health status values
 */
export type HealthStatus = 'up' | 'down';

/**
 * Health indicator result
 */
export interface HealthIndicatorResult {
  /**
   * Health status
   */
  status: HealthStatus;

  /**
   * Additional information about the health check
   */
  [key: string]: unknown;
}

/**
 * Health check result structure
 */
export interface HealthCheckResult {
  /**
   * Overall status of the health check
   */
  status: HealthStatus;

  /**
   * Information about healthy indicators
   */
  info?: Record<string, HealthIndicatorResult>;

  /**
   * Details about all indicators (including unhealthy ones)
   */
  details?: Record<string, HealthIndicatorResult>;

  /**
   * Error information if health check failed
   */
  error?: Record<string, HealthIndicatorResult>;
}
