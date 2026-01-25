import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';

import { HEALTH_OPTIONS } from './health.constants';
import { HealthService } from './health.service';

import type { HealthModuleOptions } from './types/health-module-options.interface';
import type { HealthCheckResult } from './types/health-result.interface';

/**
 * Health check controller
 * Handles health check endpoints including Kubernetes-style probes
 */
@Controller()
export class HealthController {
  private readonly enableReadiness: boolean;
  private readonly enableLiveness: boolean;
  private readonly enableStartup: boolean;

  constructor(
    private readonly healthService: HealthService,
    @Inject(HEALTH_OPTIONS) options: HealthModuleOptions
  ) {
    this.enableReadiness = options.enableReadiness ?? false;
    this.enableLiveness = options.enableLiveness ?? false;
    this.enableStartup = options.enableStartup ?? false;
  }

  /**
   * General health check endpoint
   * GET /health
   *
   * @returns Health check result
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }

  /**
   * Kubernetes readiness probe endpoint
   * GET /health/readiness
   *
   * @returns Health check result for readiness
   */
  @Get('health/readiness')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<HealthCheckResult> {
    if (!this.enableReadiness) {
      return {
        status: 'down',
        error: {
          readiness: {
            status: 'down',
            message: 'Readiness probe is not enabled',
          },
        },
      };
    }

    return this.healthService.checkReadiness();
  }

  /**
   * Kubernetes liveness probe endpoint
   * GET /health/liveness
   *
   * @returns Health check result for liveness
   */
  @Get('health/liveness')
  @HttpCode(HttpStatus.OK)
  async liveness(): Promise<HealthCheckResult> {
    if (!this.enableLiveness) {
      return {
        status: 'down',
        error: {
          liveness: {
            status: 'down',
            message: 'Liveness probe is not enabled',
          },
        },
      };
    }

    return this.healthService.checkLiveness();
  }

  /**
   * Kubernetes startup probe endpoint
   * GET /health/startup
   *
   * @returns Health check result for startup
   */
  @Get('health/startup')
  @HttpCode(HttpStatus.OK)
  async startup(): Promise<HealthCheckResult> {
    if (!this.enableStartup) {
      return {
        status: 'down',
        error: {
          startup: {
            status: 'down',
            message: 'Startup probe is not enabled',
          },
        },
      };
    }

    return this.healthService.checkStartup();
  }
}
