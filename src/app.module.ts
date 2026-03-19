import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppLoggerModule } from './common/logger/logger.module';
import { RedisModule } from './common/redis/redis.module';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
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
    }),
    AppLoggerModule,
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
  ],
  controllers: [AppController],
})
export class AppModule {}
