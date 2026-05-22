import { Injectable, Inject, Optional } from '@nestjs/common';
import { LoggerService } from '@sklv-labs/ts-nestjs-logger';

import { HEALTH_OPTIONS, HEALTH_LOG_CONTEXT } from './health.constants';

import type { HealthIndicator } from './types/health-indicator.interface';
import type { HealthModuleOptions } from './types/health-module-options.interface';
import type { HealthCheckResult, HealthStatus } from './types/health-result.interface';

/**
 * Health service wrapper around Terminus HealthCheckService
 * Provides methods to register and execute health indicators
 */
@Injectable()
export class HealthService {
  private readonly indicators: Map<string, HealthIndicator> = new Map();
  private indicatorsInitialized = false;

  constructor(
    @Inject(HEALTH_OPTIONS) private readonly options: HealthModuleOptions,
    @Optional() private readonly logger?: LoggerService
  ) {
    // Register pre-instantiated indicators from options
    if (this.options.indicators) {
      for (const indicator of this.options.indicators) {
        this.registerIndicator(indicator);
      }
    }
  }

  /**
   * Initialize indicators (called after module initialization)
   */
  onModuleInit(): void {
    if (this.indicatorsInitialized) {
      return;
    }

    // All indicators should be pre-instantiated and passed via options.indicators
    // No need for DI-based resolution anymore
    this.indicatorsInitialized = true;
  }

  /**
   * Register a health indicator
   *
   * @param indicator - Health indicator to register
   */
  registerIndicator(indicator: HealthIndicator): void {
    this.indicators.set(indicator.name, indicator);
    this.logger?.debug(
      `Registered health indicator: ${indicator.name}`,
      HEALTH_LOG_CONTEXT.HEALTH_SERVICE
    );
  }

  /**
   * Unregister a health indicator
   *
   * @param name - Name of the indicator to unregister
   */
  unregisterIndicator(name: string): void {
    this.indicators.delete(name);
    this.logger?.debug(`Unregistered health indicator: ${name}`, HEALTH_LOG_CONTEXT.HEALTH_SERVICE);
  }

  /**
   * Get all registered indicators
   *
   * @returns Array of registered health indicators
   */
  getIndicators(): HealthIndicator[] {
    return Array.from(this.indicators.values());
  }

  /**
   * Perform health check for all registered indicators
   *
   * @returns Promise resolving to health check result
   */
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const indicatorNames = Array.from(this.indicators.keys());

    this.logger?.info(
      `Starting health check for ${indicatorNames.length} indicator(s)`,
      { indicators: indicatorNames },
      HEALTH_LOG_CONTEXT.HEALTH_SERVICE
    );

    try {
      const results: Record<string, { status: HealthStatus; [key: string]: unknown }> = {};
      const errors: Record<string, { status: HealthStatus; [key: string]: unknown }> = {};
      const info: Record<string, { status: HealthStatus; [key: string]: unknown }> = {};
      const criticalErrors: Record<string, { status: HealthStatus; [key: string]: unknown }> = {};

      // Execute all indicators
      const checkPromises = Array.from(this.indicators.entries()).map(async ([name, indicator]) => {
        try {
          const result = await indicator.check();
          results[name] = result;

          if (result.status === 'up') {
            info[name] = result;
          } else {
            errors[name] = result;
            // Track critical indicator failures separately
            if (indicator.critical !== false) {
              // Default to critical if not explicitly set to false
              criticalErrors[name] = result;
            }
          }

          return { name, result, error: null, isCritical: indicator.critical !== false };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorResult = {
            status: 'down' as HealthStatus,
            message: errorMessage,
            error: errorMessage,
          };

          results[name] = errorResult;
          errors[name] = errorResult;

          // Track critical indicator failures separately
          if (indicator.critical !== false) {
            // Default to critical if not explicitly set to false
            criticalErrors[name] = errorResult;
          }

          this.logger?.error(
            `Health check failed for indicator: ${name}${indicator.critical !== false ? ' (critical)' : ''}`,
            { indicator: name, critical: indicator.critical !== false, error: errorMessage },
            HEALTH_LOG_CONTEXT.HEALTH_SERVICE
          );

          return { name, result: null, error, isCritical: indicator.critical !== false };
        }
      });

      await Promise.all(checkPromises);

      const duration = Date.now() - startTime;
      // Overall status is 'down' if any critical indicators failed, otherwise check all indicators
      const overallStatus: HealthStatus =
        Object.keys(criticalErrors).length > 0
          ? 'down'
          : Object.keys(errors).length === 0
            ? 'up'
            : 'down';

      const healthResult: HealthCheckResult = {
        status: overallStatus,
        ...(Object.keys(info).length > 0 && { info }),
        ...(Object.keys(results).length > 0 && { details: results }),
        ...(Object.keys(errors).length > 0 && { error: errors }),
        ...(Object.keys(criticalErrors).length > 0 && {
          critical: criticalErrors,
        }),
      };

      this.logger?.info(
        `Health check completed: ${overallStatus}`,
        {
          status: overallStatus,
          duration,
          indicatorsChecked: indicatorNames.length,
          healthy: Object.keys(info).length,
          unhealthy: Object.keys(errors).length,
          criticalFailures: Object.keys(criticalErrors).length,
        },
        HEALTH_LOG_CONTEXT.HEALTH_SERVICE
      );

      return healthResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';

      this.logger?.error(
        `Health check failed: ${errorMessage}`,
        { duration, error: errorMessage },
        HEALTH_LOG_CONTEXT.HEALTH_SERVICE
      );

      throw error;
    }
  }

  /**
   * Perform health check for readiness (all indicators must be healthy)
   *
   * @returns Promise resolving to health check result
   */
  async checkReadiness(): Promise<HealthCheckResult> {
    return this.check();
  }

  /**
   * Perform health check for liveness (basic service availability)
   *
   * @returns Promise resolving to health check result
   */
  async checkLiveness(): Promise<HealthCheckResult> {
    // For liveness, we can do a simpler check or use the same as readiness
    // This can be customized based on requirements
    return this.check();
  }

  /**
   * Perform health check for startup (initial service startup)
   *
   * @returns Promise resolving to health check result
   */
  async checkStartup(): Promise<HealthCheckResult> {
    // For startup, we can do a simpler check or use the same as readiness
    // This can be customized based on requirements
    return this.check();
  }
}
