import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { S3Module } from 'src/modules/s3/s3.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessageAttachment } from './entities/chat-message-attachment.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom,
      ChatMessage,
      ChatMessageAttachment,
      Booking,
    ]),
    S3Module,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
