import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from '../notifications/notification.service';
import { OtpService } from '../otp/otp.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findPublicByEmail(registerDto.email);

    if (existingUser?.isVerified) {
      throw new ConflictException('A verified user with this email already exists.');
    }

    await this.otpService.sendRegistrationOtp(registerDto, Boolean(existingUser));

    return {
      verificationRequired: true,
      message: 'OTP sent to email. Verify OTP to complete registration.',
      email: registerDto.email,
    };
  }

  async verifyRegistrationOtp(verifyOtpDto: VerifyOtpDto) {
    const registerData = await this.otpService.verifyRegistrationOtp(
      verifyOtpDto.email,
      verifyOtpDto.code,
    );

    const user = await this.usersService.create({
      ...registerData,
      isVerified: true,
    });

    await this.notificationService.sendWelcomeEmail(user.email, user.firstName);

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isVerified) {
      await this.otpService.sendLoginOtp(user.email);
      return {
        verificationRequired: true,
        message: 'Your account is not verified. OTP sent to your email.',
        email: user.email,
      };
    }

    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async verifyLoginOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(verifyOtpDto.email);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.otpService.verifyLoginOtp(verifyOtpDto.email, verifyOtpDto.code);
    const verifiedUser = await this.usersService.markUserAsVerified(user.id);

    return this.buildAuthResponse(
      verifiedUser.id,
      verifiedUser.email,
      verifiedUser.role,
    );
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findPublicByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.otpService.sendForgotPasswordOtp(user.email);

    return {
      message: 'Forgot password email sent successfully.',
      email: user.email,
    };
  }

  async validateUser(payload: JwtPayload) {
    return this.usersService.findById(payload.sub);
  }

  private buildAuthResponse(
    userId: string,
    email: string,
    role: JwtPayload['role'],
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET', 'super-secret-key'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1d') as any,
      }),
      user: payload,
    };
  }
}
