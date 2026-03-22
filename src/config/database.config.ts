import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Campaign } from 'src/modules/campaigns/entities/campaign.entity';
import { ChatMessageAttachment } from 'src/modules/chat/entities/chat-message-attachment.entity';
import { ChatMessage } from 'src/modules/chat/entities/chat-message.entity';
import { ChatRoom } from 'src/modules/chat/entities/chat-room.entity';
import { Influencer } from 'src/modules/influencers/entities/influencer.entity';
import { Otp } from 'src/modules/otp/entities/otp.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { getBooleanEnv, getRequiredEnv } from './env.config';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    url: getRequiredEnv(configService, 'DATABASE_URL'),
    synchronize: getBooleanEnv(configService, 'DB_SYNC', false),
    autoLoadEntities: false,
    entities: [
      User,
      Influencer,
      Campaign,
      Booking,
      Review,
      Otp,
      ChatRoom,
      ChatMessage,
      ChatMessageAttachment,
    ],
  };
};
