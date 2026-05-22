# @sklv-labs/ts-nestjs-health

A comprehensive health check package for NestJS services that wraps `@nestjs/terminus` while providing a clean, extensible API with built-in health indicators for common services.

## Features

- 🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🚀 **Easy Setup** - Simple API for both synchronous and asynchronous configuration
- 🛠️ **NestJS Native** - Built on top of NestJS with seamless integration
- 📦 **Built-in Indicators** - Ready-to-use health indicators for databases, Redis, RabbitMQ, external services, memory, and disk
- 🔌 **Extensible** - Easy to create custom health indicators with ORM-agnostic database support
- ☸️ **Kubernetes Ready** - Built-in support for readiness/liveness/startup probes
- 📊 **Structured Logging** - Integrated with `@sklv-labs/ts-nestjs-logger` for observability
- ⚡ **Error Handling** - Consistent error handling with `@sklv-labs/ts-nestjs-error`
- 🗄️ **Multiple Databases** - Support for monitoring multiple database connections with custom names
- 🔧 **Flexible Configuration** - Factory methods and DI-based providers for different use cases

## Installation

```bash
npm install @sklv-labs/ts-nestjs-health
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install @nestjs/common@^11.1.12 @nestjs/core@^11.1.12 @nestjs/terminus@^11.0.0
npm install @sklv-labs/ts-nestjs-database@^0.1.0
npm install @sklv-labs/ts-nestjs-error@^0.1.0
npm install @sklv-labs/ts-nestjs-logger@^0.1.0
npm install @sklv-labs/ts-nestjs-config@^0.1.0
npm install @sklv-labs/ts-core@^0.1.0
```

**Note:** `@nestjs/terminus` will automatically install `@godaddy/terminus` as its peer dependency, so you don't need to install it separately.

**Note:** This package requires Node.js 24 LTS or higher.

## Quick Start

### Basic Usage

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { HealthModule } from '@sklv-labs/ts-nestjs-health';

@Module({
  imports: [
    HealthModule.forRoot({
      path: '/health',
      enableReadiness: true,
      enableLiveness: true,
    }),
  ],
})
export class AppModule {}
```

### With Built-in Indicators

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { HealthModule, DatabaseHealthIndicator } from '@sklv-labs/ts-nestjs-health';
import { DrizzleModule, DRIZZLE_INSTANCE } from '@sklv-labs/ts-nestjs-database/drizzle';

@Module({
  imports: [
    DrizzleModule.forRoot({
      dialect: 'postgresql',
      connection: {
        connectionString: process.env.DATABASE_URL,
      },
    }),
    HealthModule.forRoot({
      indicators: [
        // Note: In real usage, drizzleInstance would be injected
        // This is a simplified example - see async config below
      ],
    }),
  ],
})
export class AppModule {}
```

### Async Configuration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule, DatabaseHealthIndicator } from '@sklv-labs/ts-nestjs-health';
import { DrizzleModule, DRIZZLE_INSTANCE } from '@sklv-labs/ts-nestjs-database/drizzle';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgresql',
        connection: {
          connectionString: config.get('DATABASE_URL'),
        },
      }),
    }),
    HealthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, DRIZZLE_INSTANCE],
      useFactory: (config: ConfigService, drizzleInstance: { execute: (query: unknown) => Promise<unknown> }) => ({
        path: config.get('HEALTH_PATH', '/health'),
        timeout: config.get('HEALTH_TIMEOUT', 5000),
        enableReadiness: config.get('HEALTH_ENABLE_READINESS', true),
        enableLiveness: config.get('HEALTH_ENABLE_LIVENESS', true),
        indicators: [
          DatabaseHealthIndicator.forDrizzle(drizzleInstance, {
            name: 'database',
            timeout: config.get('HEALTH_TIMEOUT', 5000),
          }),
        ],
      }),
    }),
  ],
})
export class AppModule {}
```

## Health Check Endpoints

Once configured, the following endpoints are available:

- `GET /health` - General health check
- `GET /health/readiness` - Kubernetes readiness probe (if enabled)
- `GET /health/liveness` - Kubernetes liveness probe (if enabled)
- `GET /health/startup` - Kubernetes startup probe (if enabled)

### Example Response

```json
{
  "status": "up",
  "info": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy"
    }
  },
  "details": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy"
    }
  }
}
```

## Built-in Health Indicators

### Database Health Indicator

The database health indicator is ORM-agnostic and works with any database through the `DatabaseConnection` interface. It supports multiple databases and various configuration options.

#### Using with Drizzle ORM

```typescript
import { HealthModule, DatabaseHealthIndicator } from '@sklv-labs/ts-nestjs-health';
import { DrizzleModule, DRIZZLE_INSTANCE } from '@sklv-labs/ts-nestjs-database/drizzle';
import { sql } from 'drizzle-orm';

@Module({
  imports: [
    DrizzleModule.forRoot({ /* ... */ }),
    HealthModule.forRootAsync({
      inject: [DRIZZLE_INSTANCE],
      useFactory: (drizzleInstance: { execute: (query: unknown) => Promise<unknown> }) => ({
        indicators: [
          DatabaseHealthIndicator.forDrizzle(drizzleInstance, {
            name: 'database',
            timeout: 5000,
            query: sql`SELECT 1`, // Optional custom query
          }),
        ],
      }),
    }),
  ],
})
export class AppModule {}
```

#### Multiple Databases

You can monitor multiple database connections:

```typescript
import { HealthModule, DatabaseHealthIndicator } from '@sklv-labs/ts-nestjs-health';

@Module({
  imports: [
    HealthModule.forRoot({
      indicators: [
        DatabaseHealthIndicator.forDrizzle(primaryDb, {
          name: 'primary-db',
          critical: true,
        }),
        DatabaseHealthIndicator.forDrizzle(readReplicaDb, {
          name: 'read-replica',
          critical: false, // Non-critical, won't affect overall health
          timeout: 3000,
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

#### Custom Database Connection

For other ORMs or custom database connections:

```typescript
import { DatabaseHealthIndicator, DatabaseConnection } from '@sklv-labs/ts-nestjs-health';

// Create a custom connection adapter
const customConnection: DatabaseConnection = {
  execute: async (query) => {
    // Your database health check logic
    return await myDatabase.ping();
  },
};

@Module({
  imports: [
    HealthModule.forRoot({
      indicators: [
        new DatabaseHealthIndicator({
          connection: customConnection,
          name: 'custom-db',
          timeout: 5000,
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

### Redis Health Indicator

```typescript
import { RedisHealthIndicator } from '@sklv-labs/ts-nestjs-health';

HealthModule.forRoot({
  indicators: [
    RedisHealthIndicator.forConnection({
      client: redisClient, // ioredis or redis client
      timeout: 5000,
    }),
  ],
})
```

### RabbitMQ Health Indicator

```typescript
import { RabbitMQHealthIndicator } from '@sklv-labs/ts-nestjs-health';

HealthModule.forRoot({
  indicators: [
    RabbitMQHealthIndicator.forConnection({
      connection: amqpConnection,
      channel: amqpChannel,
      queues: ['queue1', 'queue2'], // Optional
      timeout: 5000,
    }),
  ],
})
```

### External Service Health Indicator

```typescript
import { ExternalServiceHealthIndicator, HttpHealthIndicator } from '@sklv-labs/ts-nestjs-health';
import { HttpHealthIndicator } from '@nestjs/terminus';

HealthModule.forRoot({
  indicators: [
    ExternalServiceHealthIndicator.forUrl(
      httpHealthIndicator, // From @nestjs/terminus
      'https://api.example.com',
      {
        expectedStatusCode: 200,
        timeout: 5000,
      }
    ),
  ],
})
```

### Memory Health Indicator

```typescript
import { MemoryHealthIndicatorWrapper, MemoryHealthIndicator } from '@sklv-labs/ts-nestjs-health';
import { MemoryHealthIndicator } from '@nestjs/terminus';

HealthModule.forRoot({
  indicators: [
    MemoryHealthIndicatorWrapper.forMemory({
      memoryHealthIndicator: memoryHealthIndicator, // From @nestjs/terminus
      heapUsedThreshold: 150 * 1024 * 1024, // 150MB
      rssThreshold: 150 * 1024 * 1024, // 150MB
    }),
  ],
})
```

### Disk Health Indicator

```typescript
import { DiskHealthIndicatorWrapper, DiskHealthIndicator } from '@sklv-labs/ts-nestjs-health';
import { DiskHealthIndicator } from '@nestjs/terminus';

HealthModule.forRoot({
  indicators: [
    DiskHealthIndicatorWrapper.forDisk({
      diskHealthIndicator: diskHealthIndicator, // From @nestjs/terminus
      path: '/',
      thresholdPercent: 90,
    }),
  ],
})
```

## Custom Health Indicators

You can create custom health indicators by extending `BaseHealthIndicator`:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseHealthIndicator } from '@sklv-labs/ts-nestjs-health';
import type { HealthIndicatorResult } from '@sklv-labs/ts-nestjs-health';

@Injectable()
export class CustomHealthIndicator extends BaseHealthIndicator {
  readonly name = 'custom';

  async check(): Promise<HealthIndicatorResult> {
    try {
      // Perform your health check
      const isHealthy = await this.checkSomething();

      if (isHealthy) {
        return this.up({ message: 'Custom service is healthy' });
      }

      return this.down('Custom service is not healthy');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Custom check failed';
      this.throwError(errorMessage, 'CUSTOM_CHECK_FAILED');
    }
  }

  private async checkSomething(): Promise<boolean> {
    // Your health check logic
    return true;
  }
}
```

Then register it:

```typescript
HealthModule.forRoot({
  indicators: [new CustomHealthIndicator()],
})
```

## Configuration Options

```typescript
interface HealthModuleOptions {
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
   * Custom health indicators to register
   */
  indicators?: HealthIndicator[];
}
```

## Development

```bash
# Build
npm run build

# Lint
npm run lint

# Format
npm run format

# Test
npm run test

# Type check
npm run type-check
```

## License

MIT © [sklv-labs](https://github.com/sklv-labs)
