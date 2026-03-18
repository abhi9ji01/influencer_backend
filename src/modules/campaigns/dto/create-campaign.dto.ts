import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CampaignStatus } from '../enums/campaign-status.enum';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Skincare Launch' })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'Need 5 beauty creators for reels and stories.' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  budget!: number;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-04-20' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: CampaignStatus, default: CampaignStatus.DRAFT })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

