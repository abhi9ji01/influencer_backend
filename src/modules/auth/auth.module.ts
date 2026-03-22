import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AppJwtModule } from 'src/common/jwt/jwt.module';
import { NotificationModule } from '../notifications/notification.module';
import { OtpModule } from '../otp/otp.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    AppJwtModule,
    UsersModule,
    NotificationModule,
    OtpModule,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
