import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { QueryCampaignsDto } from './dto/query-campaigns.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignStatus } from './enums/campaign-status.enum';
import { Campaign } from './entities/campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignsRepository: Repository<Campaign>,
  ) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    currentUser: JwtPayload,
  ): Promise<Campaign> {
    if (![UserRole.CUSTOMER, UserRole.ADMIN].includes(currentUser.role)) {
      throw new ForbiddenException('Only customers or admins can create campaigns.');
    }

    const campaign = this.campaignsRepository.create({
      ...createCampaignDto,
      customerId: currentUser.sub,
      status: createCampaignDto.status ?? CampaignStatus.DRAFT,
    });

    return this.campaignsRepository.save(campaign);
  }

  async findAll(query: QueryCampaignsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.campaignsRepository
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.customer', 'customer')
      .leftJoinAndSelect('campaign.bookings', 'bookings')
      .orderBy('campaign.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere('campaign.status = :status', { status: query.status });
    }

    if (query.customerId) {
      qb.andWhere('campaign.customerId = :customerId', {
        customerId: query.customerId,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(campaign.title ILIKE :search OR campaign.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id },
      relations: ['customer', 'bookings', 'bookings.influencer'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    currentUser: JwtPayload,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id);

    if (
      currentUser.role !== UserRole.ADMIN &&
      campaign.customerId !== currentUser.sub
    ) {
      throw new ForbiddenException('You can only update your own campaigns.');
    }

    Object.assign(campaign, updateCampaignDto);
    return this.campaignsRepository.save(campaign);
  }

  async changeStatus(
    id: string,
    status: CampaignStatus,
    currentUser: JwtPayload,
  ): Promise<Campaign> {
    return this.update(id, { status }, currentUser);
  }
}
