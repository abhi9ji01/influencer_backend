import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateChatMessageDto {
  @ApiProperty({
    example: 'Updated message content after discussing the final brief.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text!: string;
}
