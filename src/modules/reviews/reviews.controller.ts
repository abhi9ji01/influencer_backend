import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a review for an influencer booking' })
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewsService.create(user.sub, createReviewDto);
  }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'List reviews' })
  findAll() {
    return this.reviewsService.findAll();
  }
}
