import { Injectable } from '@nestjs/common';

import { HealthCheckError } from '../health-error';

import { BaseHealthIndicator } from './base-health-indicator';

import type { HealthIndicatorResult } from '../types/health-result.interface';

/**
 * Options for RabbitMQ health indicator
 */
export interface RabbitMQHealthIndicatorOptions {
  /**
   * RabbitMQ connection instance (amqplib)
   */
  connection: {
    isOpen?: () => boolean;
    close?: () => Promise<void>;
  };

  /**
   * Optional channel instance for verification
   */
  channel?: {
    checkQueue?: (queue: string) => Promise<unknown>;
  };

  /**
   * Optional queue names to check existence
   */
  queues?: string[];

  /**
   * Timeout for RabbitMQ connection check in milliseconds
   * @default 5000
   */
  timeout?: number;
}

/**
 * RabbitMQ health indicator
 */
@Injectable()
export class RabbitMQHealthIndicator extends BaseHealthIndicator {
  readonly name = 'rabbitmq';
  readonly critical = true; // RabbitMQ is critical for application health

  private readonly connection: RabbitMQHealthIndicatorOptions['connection'];
  private readonly channel?: RabbitMQHealthIndicatorOptions['channel'];
  private readonly queues?: string[];
  private readonly timeout: number;

  constructor(options: RabbitMQHealthIndicatorOptions) {
    super();
    this.connection = options.connection;
    this.channel = options.channel;
    this.queues = options.queues;
    this.timeout = options.timeout ?? 5000;
  }

  /**
   * Factory method to create RabbitMQ health indicator with connection
   *
   * @param options - RabbitMQ health indicator options
   * @returns RabbitMQ health indicator instance
   */
  static forConnection(options: RabbitMQHealthIndicatorOptions): RabbitMQHealthIndicator {
    return new RabbitMQHealthIndicator(options);
  }

  /**
   * Factory method to create RabbitMQ health indicator with connection and queue checks
   *
   * @param options - RabbitMQ health indicator options (must include queues)
   * @returns RabbitMQ health indicator instance
   */
  static forConnectionWithQueues(
    options: RabbitMQHealthIndicatorOptions & { queues: string[] }
  ): RabbitMQHealthIndicator {
    return new RabbitMQHealthIndicator(options);
  }

  /**
   * Perform RabbitMQ health check
   *
   * @returns Promise resolving to health indicator result
   */
  async check(): Promise<HealthIndicatorResult> {
    try {
      // Check connection status
      if (this.connection.isOpen && !this.connection.isOpen()) {
        return this.down('RabbitMQ connection is not open');
      }

      // Check queues if provided
      if (this.queues && this.queues.length > 0 && this.channel?.checkQueue) {
        const channel = this.channel;
        const checkQueue = channel.checkQueue;
        const queues = this.queues;

        if (!checkQueue) {
          return this.down('RabbitMQ channel checkQueue method is not available');
        }

        const queueChecks = await Promise.allSettled(
          queues.map((queue) =>
            this.withTimeout(
              checkQueue(queue),
              this.timeout,
              `RabbitMQ queue check timed out for queue: ${queue}`
            )
          )
        );

        const failedQueues = queueChecks
          .map((result, index) => (result.status === 'rejected' ? queues[index] : null))
          .filter((queue): queue is string => queue !== null);

        if (failedQueues.length > 0) {
          return this.down(`Failed to verify queues: ${failedQueues.join(', ')}`, {
            failedQueues,
          });
        }
      }

      return this.up({
        message: 'RabbitMQ connection is healthy',
        queuesChecked: this.queues?.length ?? 0,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'RabbitMQ connection failed';

      throw HealthCheckError.rabbitmq(errorMessage, {
        indicator: this.name,
        timeout: this.timeout,
        error: errorMessage,
      });
    }
  }
}
