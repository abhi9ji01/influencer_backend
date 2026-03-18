import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Influencer } from './entities/influencer.entity';
import { InfluencersController } from './influencers.controller';
import { InfluencersService } from './influencers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Influencer])],
  controllers: [InfluencersController],
  providers: [InfluencersService],
  exports: [InfluencersService],
})
export class InfluencersModule {}
