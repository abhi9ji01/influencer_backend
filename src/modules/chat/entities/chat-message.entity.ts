import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { ChatMessageType } from '../enums/chat-message-type.enum';
import { ChatMessageAttachment } from './chat-message-attachment.entity';
import { ChatRoom } from './chat-room.entity';

@Entity('chat_messages')
@Index(['roomId', 'createdAt'])
@Index(['senderId'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  roomId!: string;

  @Column()
  senderId!: string;

  @Column({
    type: 'enum',
    enum: ChatMessageType,
    default: ChatMessageType.TEXT,
  })
  messageType!: ChatMessageType;

  @Column({ type: 'text', nullable: true })
  text?: string;

  @Column({ default: false })
  isEdited!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => ChatRoom, (room) => room.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roomId' })
  room!: ChatRoom;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @OneToMany(() => ChatMessageAttachment, (attachment) => attachment.message)
  attachments!: ChatMessageAttachment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
