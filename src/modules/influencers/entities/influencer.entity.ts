import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('influencers')
export class Influencer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column({ length: 120 })
  niche!: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'int', default: 0 })
  followersCount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageRate!: number;

  @Column({ nullable: true })
  instagramHandle?: string;

  @OneToOne(() => User, (user) => user.influencerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => Booking, (booking) => booking.influencer)
  bookings!: Booking[];

  @OneToMany(() => Review, (review) => review.influencer)
  reviews!: Review[];
}

