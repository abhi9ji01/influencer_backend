import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  campaignId!: string;

  @ApiProperty()
  @IsUUID()
  influencerId!: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  agreedPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

