import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { Influencer } from './entities/influencer.entity';

@Injectable()
export class InfluencersService {
  constructor(
    @InjectRepository(Influencer)
    private readonly influencersRepository: Repository<Influencer>,
  ) {}

  create(userId: string, createInfluencerDto: CreateInfluencerDto) {
    const profile = this.influencersRepository.create({
      ...createInfluencerDto,
      userId,
    });

    return this.influencersRepository.save(profile);
  }

  findAll() {
    return this.influencersRepository.find({
      relations: ['user'],
      order: { followersCount: 'DESC' },
    });
  }
}
