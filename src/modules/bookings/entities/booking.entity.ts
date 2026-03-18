import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Campaign } from 'src/modules/campaigns/entities/campaign.entity';
import { Influencer } from 'src/modules/influencers/entities/influencer.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { BookingStatus } from '../enums/booking-status.enum';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  campaignId!: string;

  @Column()
  influencerId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  agreedPrice!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status!: BookingStatus;

  @ManyToOne(() => Campaign, (campaign) => campaign.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaignId' })
  campaign!: Campaign;

  @ManyToOne(() => Influencer, (influencer) => influencer.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'influencerId' })
  influencer!: Influencer;

  @OneToMany(() => Review, (review) => review.booking)
  reviews!: Review[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
