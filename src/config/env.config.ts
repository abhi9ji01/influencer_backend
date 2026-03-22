import { ConfigService } from '@nestjs/config';

export const getRequiredEnv = (
  configService: ConfigService,
  key: string,
): string => {
  const value = configService.get<string>(key);

  if (!value || !value.trim()) {
    throw new Error(`${key} is not set in environment variables.`);
  }

  return value.trim();
};

export const getOptionalEnv = (
  configService: ConfigService,
  key: string,
): string | undefined => {
  const value = configService.get<string>(key);
  return value?.trim() || undefined;
};

export const getBooleanEnv = (
  configService: ConfigService,
  key: string,
  defaultValue = false,
): boolean => {
  const value = configService.get<string>(key);

  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return value.trim().toLowerCase() === 'true';
};

export const validateEnvironment = (
  env: Record<string, unknown>,
): Record<string, unknown> => {
  const requiredKeys = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];

  const missingKeys = requiredKeys.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || !value.trim();
  });

  if (missingKeys.length) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(', ')}`,
    );
  }

  return env;
};
