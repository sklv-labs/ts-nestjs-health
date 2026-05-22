import type { HealthIndicator } from './health-indicator.interface';
import type { ModuleMetadata } from '@nestjs/common/interfaces';

/**
 * Health module options
 */
export interface HealthModuleOptions {
  /**
   * Base path for health endpoints
   * @default '/health'
   */
  path?: string;

  /**
   * Enable /health/readiness endpoint (Kubernetes readiness probe)
   * @default false
   */
  enableReadiness?: boolean;

  /**
   * Enable /health/liveness endpoint (Kubernetes liveness probe)
   * @default false
   */
  enableLiveness?: boolean;

  /**
   * Enable /health/startup endpoint (Kubernetes startup probe)
   * @default false
   */
  enableStartup?: boolean;

  /**
   * Default timeout for health checks in milliseconds
   * @default 5000
   */
  timeout?: number;

  /**
   * Pre-instantiated health indicators to register
   * Use factory methods to create indicators (e.g., DatabaseHealthIndicator.forDrizzle())
   */
  indicators?: HealthIndicator[];
}

/**
 * Async health module options with dependency injection support
 */
export interface HealthModuleAsyncOptions<TFactoryArgs extends unknown[] = unknown[]> extends Pick<
  ModuleMetadata,
  'imports'
> {
  /**
   * Dependencies to inject into `useFactory` (e.g., `ConfigService`, `DRIZZLE_INSTANCE`)
   */
  inject?: Array<string | symbol | (new (...args: unknown[]) => unknown)>;

  /**
   * Factory returning the `HealthModuleOptions` (sync or async)
   */
  useFactory: (...args: TFactoryArgs) => HealthModuleOptions | Promise<HealthModuleOptions>;
}
