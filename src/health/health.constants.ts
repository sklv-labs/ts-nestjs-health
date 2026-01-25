/**
 * Injection token for health module options
 */
export const HEALTH_OPTIONS = Symbol('HEALTH_OPTIONS');

/**
 * Default health check configuration values
 */
export const DEFAULT_HEALTH_PATH = '/health';
export const DEFAULT_HEALTH_TIMEOUT = 5000; // 5 seconds

/**
 * Health check error codes
 */
export const HEALTH_CHECK_ERROR_CODES = {
  HEALTH_CHECK_FAILED: 'HEALTH_CHECK_FAILED',
  HEALTH_CHECK_TIMEOUT: 'HEALTH_CHECK_TIMEOUT',
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  REDIS_CONNECTION_FAILED: 'REDIS_CONNECTION_FAILED',
  RABBITMQ_CONNECTION_FAILED: 'RABBITMQ_CONNECTION_FAILED',
  EXTERNAL_SERVICE_FAILED: 'EXTERNAL_SERVICE_FAILED',
  MEMORY_THRESHOLD_EXCEEDED: 'MEMORY_THRESHOLD_EXCEEDED',
  DISK_SPACE_EXCEEDED: 'DISK_SPACE_EXCEEDED',
} as const;

/**
 * Log context identifiers for health checks
 */
export const HEALTH_LOG_CONTEXT = {
  HEALTH_SERVICE: 'HealthService',
  HEALTH_CONTROLLER: 'HealthController',
  DATABASE_INDICATOR: 'DatabaseHealthIndicator',
  REDIS_INDICATOR: 'RedisHealthIndicator',
  RABBITMQ_INDICATOR: 'RabbitMQHealthIndicator',
  EXTERNAL_SERVICE_INDICATOR: 'ExternalServiceHealthIndicator',
  MEMORY_INDICATOR: 'MemoryHealthIndicator',
  DISK_INDICATOR: 'DiskHealthIndicator',
} as const;
