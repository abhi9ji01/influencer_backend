import { ConfigService } from '@nestjs/config';
import { getOptionalEnv, getRequiredEnv } from './env.config';

export interface AwsS3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  publicBaseUrl?: string;
}

export const getAwsS3Config = (configService: ConfigService): AwsS3Config => {
  return {
    accessKeyId: getRequiredEnv(configService, 'AWS_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnv(configService, 'AWS_SECRET_ACCESS_KEY'),
    region: getRequiredEnv(configService, 'AWS_REGION'),
    bucketName: getRequiredEnv(configService, 'AWS_S3_BUCKET'),
    publicBaseUrl: getOptionalEnv(configService, 'AWS_S3_PUBLIC_URL'),
  };
};
