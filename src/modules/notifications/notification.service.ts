import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { getForgotPasswordEmailTemplate } from './templates/forgot-password.template';
import { getVerificationEmailTemplate } from './templates/verification.template';
import { getWelcomeEmailTemplate } from './templates/welcome.template';

@Injectable()
export class NotificationService {
  private sendgridMail: any;
  private twilioClient: any;
  private readonly isProduction: boolean;
  private readonly isDevelopment: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.isDevelopment = !this.isProduction;
    this.initializeSendGrid();
    this.initializeTwilio();
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const html = getVerificationEmailTemplate(otp, this.getPlatformName());
    await this.sendEmail(email, 'Verify your account OTP', html);
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = getWelcomeEmailTemplate(firstName, this.getPlatformName());
    await this.sendEmail(email, `Welcome to ${this.getPlatformName()}`, html);
  }

  async sendForgotPasswordEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    const html = getForgotPasswordEmailTemplate(resetLink, this.getPlatformName());
    await this.sendEmail(email, 'Reset your password', html);
  }

  async sendTwilioVerifyOtp(phone: string, countryCode = '91'): Promise<void> {
    const fullNumber = `+${countryCode.replace(/\D/g, '')}${phone.replace(/\D/g, '')}`;

    if (this.isDevelopment) {
      this.logger.info(`[MOCK TWILIO VERIFY] OTP sent to ${fullNumber}`, NotificationService.name);
      return;
    }

    if (!this.twilioClient) {
      throw new BadRequestException('Twilio is not configured.');
    }

    const serviceSid = this.configService.get<string>('TWILIO_SERVICE_SID');

    await this.twilioClient.verify.v2
      .services(serviceSid)
      .verifications.create({ to: fullNumber, channel: 'sms' });

    this.logger.info(`Twilio OTP sent to ${fullNumber}`, NotificationService.name);
  }

  async verifyTwilioOtp(phone: string, countryCode: string, code: string): Promise<boolean> {
    const fullNumber = `+${countryCode.replace(/\D/g, '')}${phone.replace(/\D/g, '')}`;

    if (this.isDevelopment) {
      this.logger.info(`[MOCK TWILIO VERIFY CHECK] OTP verified for ${fullNumber}`, NotificationService.name);
      return code === '123456';
    }

    if (!this.twilioClient) {
      return false;
    }

    const serviceSid = this.configService.get<string>('TWILIO_SERVICE_SID');

    const check = await this.twilioClient.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: fullNumber, code });

    return check.status === 'approved';
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (this.isDevelopment) {
      this.logger.info(`[MOCK EMAIL] ${subject} -> ${to}`, NotificationService.name);
      return;
    }

    if (!this.sendgridMail) {
      throw new BadRequestException('SendGrid is not configured.');
    }

    const fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@example.com');
    const platformName = this.getPlatformName();

    await this.sendgridMail.send({
      to,
      from: {
        email: fromEmail,
        name: platformName,
      },
      subject,
      html,
    });

    this.logger.info(`Email sent to ${to}`, NotificationService.name);
  }

  private initializeSendGrid(): void {
    if (this.isDevelopment) {
      this.logger.info('SendGrid running in mock mode for development.', NotificationService.name);
      return;
    }

    try {
      const sendGridKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (!sendGridKey) {
        this.logger.warn('SendGrid API key not configured.', NotificationService.name);
        return;
      }

      this.sendgridMail = require('@sendgrid/mail');
      this.sendgridMail.setApiKey(sendGridKey);
      this.logger.info('SendGrid client initialized.', NotificationService.name);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`SendGrid initialization skipped: ${err.message}`, NotificationService.name);
    }
  }

  private initializeTwilio(): void {
    if (this.isDevelopment) {
      this.logger.info('Twilio running in mock mode for development.', NotificationService.name);
      return;
    }

    try {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const serviceSid = this.configService.get<string>('TWILIO_SERVICE_SID');

      if (!accountSid || !authToken || !serviceSid) {
        this.logger.warn('Twilio credentials not configured.', NotificationService.name);
        return;
      }

      const twilio = require('twilio');
      this.twilioClient = twilio(accountSid, authToken);
      this.logger.info('Twilio client initialized.', NotificationService.name);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Twilio initialization skipped: ${err.message}`, NotificationService.name);
    }
  }

  private getPlatformName(): string {
    return this.configService.get<string>('PLATFORM_NAME', 'Influencer Marketplace');
  }
}
