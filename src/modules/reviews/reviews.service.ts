import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  create(customerId: string, createReviewDto: CreateReviewDto) {
    const review = this.reviewsRepository.create({
      customerId,
      ...createReviewDto,
    });

    return this.reviewsRepository.save(review);
  }

  findAll() {
    return this.reviewsRepository.find({
      relations: ['customer', 'influencer', 'booking'],
      order: { createdAt: 'DESC' },
    });
  }
}
