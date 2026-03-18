import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppLoggerService } from './common/logger/logger.service';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { swaggerConfig } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const reflector = app.get(Reflector);
  const logger = app.get(AppLoggerService);

  app.useLogger(logger);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new TransformResponseInterceptor(reflector));

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .addBearerAuth()
      .build(),
  );

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.PORT ?? 8000);
  const host = process.env.APP_HOST ?? 'localhost';

  await app.listen(port);

  const dataSource = app.get(DataSource);
  const backendUrl = `http://${host}:${port}/api`;
  const swaggerUrl = `http://${host}:${port}/docs`;

  logger.info('=================================', 'Bootstrap');
  logger.info('Influencer Backend Started', 'Bootstrap');
  logger.info('=================================', 'Bootstrap');
  logger.info(`DB Status      : ${dataSource.isInitialized ? 'connected' : 'disconnected'}`, 'Bootstrap');
  logger.info(`Backend Port   : ${port}`, 'Bootstrap');
  logger.info(`Backend URL    : ${backendUrl}`, 'Bootstrap');
  logger.info(`Swagger URL    : ${swaggerUrl}`, 'Bootstrap');
  logger.info('=================================', 'Bootstrap');
}

bootstrap();
