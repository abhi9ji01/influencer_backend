import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateChatRoomDto {
  @ApiProperty({
    example: '6cbd0ad3-43a0-4063-9ef5-df4d0ba0dba1',
    description: 'Booking ID used as the chat room source of truth.',
  })
  @IsUUID()
  bookingId!: string;
}
