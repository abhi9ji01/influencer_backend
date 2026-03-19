import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { AppLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class S3Service {
  private client: any;
  private bucketName?: string;
  private region?: string;
  private publicBaseUrl?: string;

  private readonly supportedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/mpeg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
  ]);

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async uploadFile(file: any, folder?: string) {
    this.validateFile(file);
    const key = this.buildFileKey(file.originalname, folder);
    const client = this.getClient();
    const { PutObjectCommand } = require('@aws-sdk/client-s3');

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    const result = this.buildUploadResult(key, file);
    this.logger.info(`S3 file uploaded: ${key}`, S3Service.name);
    return result;
  }

  async uploadFiles(files: any[], folder?: string) {
    const uploads = await Promise.all(
      files.map((file) => this.uploadFile(file, folder)),
    );

    this.logger.info(
      `S3 multiple file upload completed. Count: ${uploads.length}`,
      S3Service.name,
    );

    return uploads;
  }

  async deleteFile(key: string): Promise<void> {
    if (!key) {
      throw new BadRequestException('File key is required.');
    }

    const client = this.getClient();
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    this.logger.info(`S3 file deleted: ${key}`, S3Service.name);
  }

  async deleteFiles(keys: string[]): Promise<void> {
    if (!keys.length) {
      throw new BadRequestException('At least one file key is required.');
    }

    const client = this.getClient();
    const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');

    await client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
        },
      }),
    );

    this.logger.info(
      `S3 multiple file delete completed. Count: ${keys.length}`,
      S3Service.name,
    );
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const client = this.getClient();
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
      { expiresIn },
    );
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch {
      return false;
    }
  }

  async getFileMetadata(key: string) {
    const client = this.getClient();
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');

    const metadata = await client.send(
      new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    return {
      key,
      bucket: this.bucketName,
      contentType: metadata.ContentType,
      contentLength: metadata.ContentLength,
      lastModified: metadata.LastModified,
      etag: metadata.ETag,
      metadata: metadata.Metadata,
    };
  }

  private getClient(): any {
    if (this.client) {
      return this.client;
    }

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    const publicBaseUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL');

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
      throw new InternalServerErrorException(
        'AWS S3 configuration is missing. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET in .env.',
      );
    }

    const { S3Client } = require('@aws-sdk/client-s3');

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = bucketName;
    this.region = region;
    this.publicBaseUrl = publicBaseUrl;

    this.logger.info('AWS S3 client initialized.', S3Service.name);
    return this.client;
  }

  private validateFile(file: any): void {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const isSupportedMimeType =
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      this.supportedMimeTypes.has(file.mimetype);

    if (!isSupportedMimeType) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed types include documents, images, gifs, and videos.`,
      );
    }
  }

  private buildFileKey(originalName: string, folder?: string): string {
    const safeFolder = folder?.trim().replace(/^\/+|\/+$/g, '');
    const extension = extname(originalName);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    return safeFolder ? `${safeFolder}/${fileName}` : fileName;
  }

  private buildUploadResult(key: string, file: any) {
    const publicUrl = this.publicBaseUrl
      ? `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`
      : `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      key,
      bucket: this.bucketName,
      url: publicUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}

