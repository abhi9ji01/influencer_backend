import { Injectable, LoggerService } from '@nestjs/common';
import { createWinstonLogger } from './logger.config';

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logger: any = createWinstonLogger();

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  info(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}
