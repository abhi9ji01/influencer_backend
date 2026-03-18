import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';
import { getRedisConfig } from 'src/config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: any;
  private status = 'disconnected';

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.status = 'disconnected';
    }
  }

  async connect(): Promise<void> {
    const { url } = getRedisConfig(this.configService);

    try {
      const Redis = require('ioredis');
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
      });

      this.client.on('error', (error: Error) => {
        this.status = 'error';
        this.logger.error(
          `Redis client error: ${error.message}`,
          error.stack,
          RedisService.name,
        );
      });

      const maxAttempts = 5;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          await this.client.connect();
          await this.client.ping();
          this.status = 'connected';
          this.logger.info(`Redis connection established at ${url}.`, RedisService.name);
          return;
        } catch (error) {
          const err = error as Error;
          this.status = 'connecting';
          this.logger.warn(
            `Redis connection attempt ${attempt}/${maxAttempts} failed: ${err.message}`,
            RedisService.name,
          );

          if (attempt === maxAttempts) {
            throw err;
          }

          await this.delay(1500);
        }
      }
    } catch (error) {
      this.status = 'unavailable';
      const err = error as Error;
      this.logger.warn(
        `Redis connection unavailable at ${url}: ${err.message}`,
        RedisService.name,
      );
    }
  }

  getClient(): any {
    return this.client;
  }

  getStatus(): string {
    return this.status;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
