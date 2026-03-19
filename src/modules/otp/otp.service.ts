import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { NotificationService } from '../notifications/notification.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { Otp, OtpPurpose } from './entities/otp.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly notificationService: NotificationService,
  ) {}

  async sendRegistrationOtp(registerDto: RegisterDto, userExists: boolean): Promise<void> {
    if (userExists) {
      throw new ConflictException('A user with this email already exists.');
    }

    await this.createEmailOtp(registerDto.email, OtpPurpose.REGISTER, {
      registerData: registerDto,
    });
  }

  async sendLoginOtp(email: string): Promise<void> {
    await this.createEmailOtp(email, OtpPurpose.LOGIN);
  }

  async sendForgotPasswordOtp(email: string): Promise<string> {
    const token = this.generateOtpToken();
    await this.notificationService.sendForgotPasswordEmail(email, token);
    await this.createEmailOtp(email, OtpPurpose.FORGOT_PASSWORD, { token });
    return token;
  }

  async verifyRegistrationOtp(email: string, code: string): Promise<RegisterDto> {
    const otp = await this.getValidOtp(email, code, OtpPurpose.REGISTER);
    otp.isVerified = true;
    await this.otpRepository.save(otp);

    const registerData = otp.metadata?.registerData as RegisterDto | undefined;
    if (!registerData) {
      throw new BadRequestException('Registration data not found for this OTP.');
    }

    return registerData;
  }

  async verifyLoginOtp(email: string, code: string): Promise<boolean> {
    const otp = await this.getValidOtp(email, code, OtpPurpose.LOGIN);
    otp.isVerified = true;
    await this.otpRepository.save(otp);
    return true;
  }

  async verifyForgotPasswordOtp(email: string, code: string): Promise<boolean> {
    const otp = await this.getValidOtp(email, code, OtpPurpose.FORGOT_PASSWORD);
    otp.isVerified = true;
    await this.otpRepository.save(otp);
    return true;
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private async createEmailOtp(
    entity: string,
    purpose: OtpPurpose,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.otpRepository.delete({ entity, purpose });

    const code = process.env.NODE_ENV === 'development' ? '123456' : this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otp = this.otpRepository.create({
      entity,
      purpose,
      code,
      expiresAt,
      metadata,
    });

    await this.otpRepository.save(otp);
    await this.notificationService.sendOtpEmail(entity, code);
  }

  private async getValidOtp(
    entity: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<Otp> {
    const otp = await this.otpRepository.findOne({
      where: {
        entity,
        code,
        purpose,
        isVerified: false,
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!otp) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    return otp;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateOtpToken(): string {
    return `${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
