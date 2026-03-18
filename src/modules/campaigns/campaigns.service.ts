import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from 'src/common/logger/logger.service';
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
    private readonly logger: AppLoggerService,
  ) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    currentUser: JwtPayload,
  ): Promise<Campaign> {
    this.logger.debug(
      `Attempting campaign creation for user ${currentUser.sub}`,
      CampaignsService.name,
    );

    if (![UserRole.CUSTOMER, UserRole.ADMIN].includes(currentUser.role)) {
      this.logger.warn(
        `Campaign creation blocked for user ${currentUser.sub} with role ${currentUser.role}`,
        CampaignsService.name,
      );
      throw new ForbiddenException('Only customers or admins can create campaigns.');
    }

    const campaign = this.campaignsRepository.create({
      ...createCampaignDto,
      customerId: currentUser.sub,
      status: createCampaignDto.status ?? CampaignStatus.DRAFT,
    });

    const savedCampaign = await this.campaignsRepository.save(campaign);

    this.logger.info(
      `Campaign ${savedCampaign.id} created successfully for user ${currentUser.sub}`,
      CampaignsService.name,
    );

    return savedCampaign;
  }

  async findAll(query: QueryCampaignsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    this.logger.debug(
      `Fetching campaigns with page=${page}, limit=${limit}, search=${query.search ?? 'n/a'}`,
      CampaignsService.name,
    );

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

    this.logger.info(
      `Fetched ${items.length} campaigns out of total ${total}`,
      CampaignsService.name,
    );

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
      this.logger.warn(`Campaign ${id} was not found.`, CampaignsService.name);
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
      this.logger.warn(
        `User ${currentUser.sub} attempted to update campaign ${id} without permission.`,
        CampaignsService.name,
      );
      throw new ForbiddenException('You can only update your own campaigns.');
    }

    Object.assign(campaign, updateCampaignDto);
    const updatedCampaign = await this.campaignsRepository.save(campaign);

    this.logger.info(
      `Campaign ${updatedCampaign.id} updated by user ${currentUser.sub}`,
      CampaignsService.name,
    );

    return updatedCampaign;
  }

  async changeStatus(
    id: string,
    status: CampaignStatus,
    currentUser: JwtPayload,
  ): Promise<Campaign> {
    this.logger.info(
      `Changing campaign ${id} status to ${status}`,
      CampaignsService.name,
    );

    return this.update(id, { status }, currentUser);
  }
}
