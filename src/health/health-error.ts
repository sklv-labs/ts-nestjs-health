import { BaseError } from '@sklv-labs/ts-nestjs-error';

import { HEALTH_CHECK_ERROR_CODES } from './health.constants';

/**
 * Health check error class
 * Extends BaseError for consistent error handling
 */
export class HealthCheckError extends BaseError {
  /**
   * Creates a health check error
   *
   * @param message - Error message
   * @param code - Error code (default: 'HEALTH_CHECK_FAILED')
   * @param metadata - Optional metadata
   */
  constructor(
    message: string,
    code: string = HEALTH_CHECK_ERROR_CODES.HEALTH_CHECK_FAILED,
    metadata?: Record<string, unknown>
  ) {
    super(message, code, {
      statusCode: 503, // Service Unavailable
      metadata,
      loggable: true,
      exposeToClient: true,
    });
  }

  /**
   * Creates a health check timeout error
   *
   * @param message - Error message
   * @param metadata - Optional metadata
   */
  static timeout(message: string, metadata?: Record<string, unknown>): HealthCheckError {
    return new HealthCheckError(message, HEALTH_CHECK_ERROR_CODES.HEALTH_CHECK_TIMEOUT, metadata);
  }

  /**
   * Creates a database connection error
   *
   * @param message - Error message
   * @param metadata - Optional metadata
   */
  static database(message: string, metadata?: Record<string, unknown>): HealthCheckError {
    return new HealthCheckError(
      message,
      HEALTH_CHECK_ERROR_CODES.DATABASE_CONNECTION_FAILED,
      metadata
    );
  }

  /**
   * Creates a Redis connection error
   *
   * @param message - Error message
   * @param metadata - Optional metadata
   */
  static redis(message: string, metadata?: Record<string, unknown>): HealthCheckError {
    return new HealthCheckError(
      message,
      HEALTH_CHECK_ERROR_CODES.REDIS_CONNECTION_FAILED,
      metadata
    );
  }

  /**
   * Creates a RabbitMQ connection error
   *
   * @param message - Error message
   * @param metadata - Optional metadata
   */
  static rabbitmq(message: string, metadata?: Record<string, unknown>): HealthCheckError {
    return new HealthCheckError(
      message,
      HEALTH_CHECK_ERROR_CODES.RABBITMQ_CONNECTION_FAILED,
      metadata
    );
  }

  /**
   * Creates an external service error
   *
   * @param message - Error message
   * @param metadata - Optional metadata
   */
  static externalService(message: string, metadata?: Record<string, unknown>): HealthCheckError {
    return new HealthCheckError(
      message,
      HEALTH_CHECK_ERROR_CODES.EXTERNAL_SERVICE_FAILED,
      metadata
    );
  }
}
