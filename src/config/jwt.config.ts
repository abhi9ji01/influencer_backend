import { ConfigService } from '@nestjs/config';
import { getRequiredEnv } from './env.config';

export const getJwtSecret = (configService: ConfigService): string => {
  return getRequiredEnv(configService, 'JWT_SECRET');
};

export const getJwtExpiresIn = (configService: ConfigService): string => {
  return configService.get<string>('JWT_EXPIRES_IN') || '1d';
};
