import { Injectable } from '@nestjs/common';
import { DiskHealthIndicator } from '@nestjs/terminus';

import { BaseHealthIndicator } from './base-health-indicator';

import type { HealthIndicatorResult } from '../types/health-result.interface';

/**
 * Options for disk health indicator
 */
export interface DiskHealthIndicatorOptions {
  /**
   * Terminus disk health indicator instance
   */
  diskHealthIndicator: DiskHealthIndicator;

  /**
   * Path to check disk space for
   * @default '/'
   */
  path?: string;

  /**
   * Threshold for disk usage percentage (0-100)
   * @default 90
   */
  thresholdPercent?: number;

  /**
   * Threshold for free disk space in bytes
   */
  thresholdBytes?: number;
}

/**
 * Disk health indicator
 * Wraps Terminus DiskHealthIndicator
 */
@Injectable()
export class DiskHealthIndicatorWrapper extends BaseHealthIndicator {
  readonly name = 'disk';
  readonly critical = true; // Disk space issues are critical

  private readonly diskHealthIndicator: DiskHealthIndicator;
  private readonly path: string;
  private readonly thresholdPercent?: number;
  private readonly thresholdBytes?: number;

  constructor(options: DiskHealthIndicatorOptions) {
    super();
    this.diskHealthIndicator = options.diskHealthIndicator;
    this.path = options.path ?? '/';
    this.thresholdPercent = options.thresholdPercent;
    this.thresholdBytes = options.thresholdBytes;
  }

  /**
   * Factory method to create disk health indicator
   *
   * @param options - Disk health indicator options
   * @returns Disk health indicator instance
   */
  static forDisk(options: DiskHealthIndicatorOptions): DiskHealthIndicatorWrapper {
    return new DiskHealthIndicatorWrapper(options);
  }

  /**
   * Perform disk health check
   *
   * @returns Promise resolving to health indicator result
   */
  async check(): Promise<HealthIndicatorResult> {
    try {
      let result;

      if (this.thresholdPercent !== undefined) {
        result = await this.diskHealthIndicator.checkStorage('disk', {
          path: this.path,
          thresholdPercent: this.thresholdPercent,
        });
      } else if (this.thresholdBytes !== undefined) {
        result = await this.diskHealthIndicator.checkStorage('disk', {
          path: this.path,
          threshold: this.thresholdBytes,
        });
      } else {
        // Default to 90% threshold
        result = await this.diskHealthIndicator.checkStorage('disk', {
          path: this.path,
          thresholdPercent: 90,
        });
      }

      const diskResult = result['disk'];

      if (diskResult.status === 'down') {
        return this.down('Disk space threshold exceeded', {
          disk: diskResult,
          path: this.path,
        });
      }

      return this.up({
        message: 'Disk space is within thresholds',
        disk: diskResult,
        path: this.path,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disk health check failed';

      return this.down(errorMessage, {
        error: errorMessage,
        path: this.path,
      });
    }
  }
}
