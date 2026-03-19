import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/modules/users/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Jamie' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Lee' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'jamie@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CUSTOMER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
