import { Injectable } from '@nestjs/common';
import { MemoryHealthIndicator } from '@nestjs/terminus';

import { BaseHealthIndicator } from './base-health-indicator';

import type { HealthIndicatorResult } from '../types/health-result.interface';

/**
 * Options for memory health indicator
 */
export interface MemoryHealthIndicatorOptions {
  /**
   * Terminus memory health indicator instance
   */
  memoryHealthIndicator: MemoryHealthIndicator;

  /**
   * Heap memory threshold in bytes
   * @default 150 * 1024 * 1024 (150MB)
   */
  heapUsedThreshold?: number;

  /**
   * RSS memory threshold in bytes
   * @default 150 * 1024 * 1024 (150MB)
   */
  rssThreshold?: number;
}

/**
 * Memory health indicator
 * Wraps Terminus MemoryHealthIndicator
 */
@Injectable()
export class MemoryHealthIndicatorWrapper extends BaseHealthIndicator {
  readonly name = 'memory';

  private readonly memoryHealthIndicator: MemoryHealthIndicator;
  private readonly heapUsedThreshold: number;
  private readonly rssThreshold: number;

  constructor(options: MemoryHealthIndicatorOptions) {
    super();
    this.memoryHealthIndicator = options.memoryHealthIndicator;
    this.heapUsedThreshold = options.heapUsedThreshold ?? 150 * 1024 * 1024; // 150MB
    this.rssThreshold = options.rssThreshold ?? 150 * 1024 * 1024; // 150MB
  }

  /**
   * Factory method to create memory health indicator
   *
   * @param options - Memory health indicator options
   * @returns Memory health indicator instance
   */
  static forMemory(options: MemoryHealthIndicatorOptions): MemoryHealthIndicatorWrapper {
    return new MemoryHealthIndicatorWrapper(options);
  }

  /**
   * Perform memory health check
   *
   * @returns Promise resolving to health indicator result
   */
  async check(): Promise<HealthIndicatorResult> {
    try {
      const result = await this.memoryHealthIndicator.checkHeap('memory', this.heapUsedThreshold);
      const rssResult = await this.memoryHealthIndicator.checkRSS('memory', this.rssThreshold);

      // Combine results
      const memoryResult = result['memory'];
      const rssMemoryResult = rssResult['memory'];

      if (memoryResult.status === 'down' || rssMemoryResult.status === 'down') {
        return this.down('Memory threshold exceeded', {
          heap: memoryResult,
          rss: rssMemoryResult,
        });
      }

      return this.up({
        message: 'Memory usage is within thresholds',
        heap: memoryResult,
        rss: rssMemoryResult,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Memory health check failed';

      return this.down(errorMessage, {
        error: errorMessage,
      });
    }
  }
}
