import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../notifications/notification.module';
import { Otp } from './entities/otp.entity';
import { OtpService } from './otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([Otp]), NotificationModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
