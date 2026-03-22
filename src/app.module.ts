import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppLoggerModule } from './common/logger/logger.module';
import { AppJwtModule } from './common/jwt/jwt.module';
import { RedisModule } from './common/redis/redis.module';
import { databaseConfig } from './config/database.config';
import { validateEnvironment } from './config/env.config';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ChatModule } from './modules/chat/chat.module';
import { InfluencersModule } from './modules/influencers/influencers.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { OtpModule } from './modules/otp/otp.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { S3Module } from './modules/s3/s3.module';
import { SocketModule } from './modules/socket/socket.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    AppLoggerModule,
    AppJwtModule,
    RedisModule,
    SocketModule,
    NotificationModule,
    OtpModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    AuthModule,
    UsersModule,
    InfluencersModule,
    CampaignsModule,
    BookingsModule,
    ReviewsModule,
    S3Module,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
