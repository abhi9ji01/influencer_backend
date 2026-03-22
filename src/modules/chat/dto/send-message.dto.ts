import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 'Hello, I have reviewed your campaign brief and I am interested.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text!: string;
}
