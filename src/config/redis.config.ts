import { ConfigService } from '@nestjs/config';

export interface RedisConfig {
  url: string;
}

export const getRedisConfig = (configService: ConfigService): RedisConfig => ({
  url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
});
