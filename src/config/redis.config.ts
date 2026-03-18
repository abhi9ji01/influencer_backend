import { ConfigService } from '@nestjs/config';

export interface RedisConfig {
  url: string;
}

export const getRedisConfig = (configService: ConfigService): RedisConfig => {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (!redisUrl) {
    throw new Error('REDIS_URL is not set in environment variables.');
  }

  return {
    url: redisUrl,
  };
};
