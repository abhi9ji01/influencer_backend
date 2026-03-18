import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    return this.buildAuthResponse(user.id, user.email, user.role);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse(user.id, user.email, user.role);
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
