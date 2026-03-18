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
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { InfluencersService } from './influencers.service';

@ApiTags('Influencers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('influencers')
export class InfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  @Post()
  @Roles(UserRole.INFLUENCER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create influencer profile' })
  create(
    @Body() createInfluencerDto: CreateInfluencerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.influencersService.create(user.sub, createInfluencerDto);
  }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.INFLUENCER)
  @ApiOperation({ summary: 'List influencer profiles' })
  findAll() {
    return this.influencersService.findAll();
  }
}
