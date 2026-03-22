import { ConfigService } from '@nestjs/config';
import { getRequiredEnv } from './env.config';

export interface RedisConfig {
  url: string;
}

export const getRedisConfig = (configService: ConfigService): RedisConfig => {
  return {
    url: getRequiredEnv(configService, 'REDIS_URL'),
  };
};
