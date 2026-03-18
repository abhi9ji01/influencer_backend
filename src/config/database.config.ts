import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Campaign } from 'src/modules/campaigns/entities/campaign.entity';
import { Influencer } from 'src/modules/influencers/entities/influencer.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { User } from 'src/modules/users/entities/user.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>(
    'DATABASE_URL',
    'postgresql://postgres:root@localhost:5432/influencer_db',
  ),
  synchronize: configService.get<string>('DB_SYNC', 'false') === 'true',
  autoLoadEntities: false,
  entities: [User, Influencer, Campaign, Booking, Review],
});
