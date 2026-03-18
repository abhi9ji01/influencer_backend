import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Influencer } from 'src/modules/influencers/entities/influencer.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @Column()
  influencerId!: string;

  @Column()
  bookingId!: string;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @ManyToOne(() => Influencer, (influencer) => influencer.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'influencerId' })
  influencer!: Influencer;

  @ManyToOne(() => Booking, (booking) => booking.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  @CreateDateColumn()
  createdAt!: Date;
}
