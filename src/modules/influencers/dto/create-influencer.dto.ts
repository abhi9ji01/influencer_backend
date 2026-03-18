import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInfluencerDto {
  @ApiProperty({ example: 'Beauty' })
  @IsString()
  niche!: string;

  @ApiPropertyOptional({ example: 'UGC creator and lifestyle storyteller.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  followersCount?: number;

  @ApiPropertyOptional({ example: 'creator_handle' })
  @IsOptional()
  @IsString()
  instagramHandle?: string;
}

