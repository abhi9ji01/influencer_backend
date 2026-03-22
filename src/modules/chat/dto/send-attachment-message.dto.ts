import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendAttachmentMessageDto {
  @ApiPropertyOptional({
    example: 'Sharing the reel draft and product deck here.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  text?: string;
}
