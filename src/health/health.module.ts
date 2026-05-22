import { DynamicModule, Module, OnModuleInit, Provider } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HEALTH_OPTIONS } from './health.constants';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

import type {
  HealthModuleAsyncOptions,
  HealthModuleOptions,
} from './types/health-module-options.interface';

/**
 * Health module for NestJS
 * Provides health check endpoints and indicators
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { Module } from '@nestjs/common';
 * import { HealthModule } from '@sklv-labs/ts-nestjs-health';
 *
 * @Module({
 *   imports: [
 *     HealthModule.forRoot({
 *       path: '/health',
 *       enableReadiness: true,
 *       enableLiveness: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class HealthModule implements OnModuleInit {
  constructor(private readonly healthService: HealthService) {}

  onModuleInit(): void {
    this.healthService.onModuleInit();
  }
  /**
   * Synchronously configure the Health module
   *
   * @param options - Health module options
   * @returns Dynamic module configuration
   */
  static forRoot(options: HealthModuleOptions = {}): DynamicModule {
    const healthOptionsProvider: Provider = {
      provide: HEALTH_OPTIONS,
      useValue: options,
    };

    return {
      module: HealthModule,
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [healthOptionsProvider, HealthService],
      exports: [HealthService, HEALTH_OPTIONS],
    };
  }

  /**
   * Asynchronously configure the Health module with dependency injection support
   *
   * @param options - Health module async options
   * @returns Dynamic module configuration
   *
   * @example
   * ```typescript
   * // app.module.ts
   * import { Module } from '@nestjs/common';
   * import { ConfigModule, ConfigService } from '@nestjs/config';
   * import { HealthModule } from '@sklv-labs/ts-nestjs-health';
   *
   * @Module({
   *   imports: [
   *     ConfigModule.forRoot(),
   *     HealthModule.forRootAsync({
   *       imports: [ConfigModule],
   *       inject: [ConfigService],
   *       useFactory: (config: ConfigService) => ({
   *         path: config.get('HEALTH_PATH', '/health'),
   *         timeout: config.get('HEALTH_TIMEOUT', 5000),
   *         enableReadiness: config.get('HEALTH_ENABLE_READINESS', true),
   *         enableLiveness: config.get('HEALTH_ENABLE_LIVENESS', true),
   *       }),
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRootAsync<TFactoryArgs extends unknown[] = unknown[]>(
    options: HealthModuleAsyncOptions<TFactoryArgs>
  ): DynamicModule {
    const healthOptionsProvider: Provider = {
      provide: HEALTH_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    return {
      module: HealthModule,
      imports: [TerminusModule, ...(options.imports ?? [])],
      controllers: [HealthController],
      providers: [healthOptionsProvider, HealthService],
      exports: [HealthService, HEALTH_OPTIONS],
    };
  }
}
