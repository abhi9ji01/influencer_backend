import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Influencer } from 'src/modules/influencers/entities/influencer.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_rooms')
@Index(['bookingId'], { unique: true })
@Index(['customerId'])
@Index(['influencerUserId'])
@Index(['lastMessageAt'])
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  bookingId!: string;

  @Column()
  customerId!: string;

  @Column()
  influencerId!: string;

  @Column()
  influencerUserId!: string;

  @Column({ nullable: true })
  lastMessageId?: string;

  @Column({ type: 'text', nullable: true })
  lastMessagePreview?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  @Column({ type: 'int', default: 0 })
  customerUnreadCount!: number;

  @Column({ type: 'int', default: 0 })
  influencerUnreadCount!: number;

  @Column({ default: true })
  isActive!: boolean;

  @OneToOne(() => Booking, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking!: Booking;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @ManyToOne(() => Influencer, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'influencerId' })
  influencer!: Influencer;

  @OneToMany(() => ChatMessage, (message) => message.room)
  messages!: ChatMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
