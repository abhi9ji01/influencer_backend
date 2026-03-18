import { mkdirSync } from 'fs';
import { join } from 'path';
import { format, transports, createLogger } from 'winston';

const logsDirectory = join(process.cwd(), 'logs');
mkdirSync(logsDirectory, { recursive: true });

const isProduction = process.env.NODE_ENV === 'production';

const allowLevels = (levels: string[]) =>
  format((info: any) => (levels.includes(info.level) ? info : false))();

export function createWinstonLogger(): any {
  return createLogger({
    level: isProduction ? 'info' : 'debug',
    defaultMeta: {
      service: 'influencer-marketplace-backend',
      environment: process.env.NODE_ENV ?? 'development',
    },
    transports: [
      new transports.File({
        filename: join(logsDirectory, 'app.log'),
        level: isProduction ? 'info' : 'debug',
        format: format.combine(
          allowLevels(isProduction ? ['info', 'error'] : ['debug', 'info', 'warn', 'error']),
          format.timestamp(),
          format.errors({ stack: true }),
          format.json(),
        ),
      }),
      new transports.File({
        filename: join(logsDirectory, 'error.log'),
        level: 'error',
        format: format.combine(
          allowLevels(['error']),
          format.timestamp(),
          format.errors({ stack: true }),
          format.json(),
        ),
      }),
      ...(!isProduction
        ? [
            new transports.Console({
              level: 'debug',
              format: format.combine(
                allowLevels(['debug', 'info', 'warn', 'error']),
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.colorize({ all: true }),
                format.errors({ stack: true }),
                format.printf(({ timestamp, level, context, message, stack }: any) => {
                  const scope = context ? `[${context}] ` : '';
                  return `${timestamp} ${level} ${scope}${stack ?? message}`;
                }),
              ),
            }),
          ]
        : []),
    ],
  });
}


