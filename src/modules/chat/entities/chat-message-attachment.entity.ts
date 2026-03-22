import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatAttachmentType } from '../enums/chat-attachment-type.enum';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_message_attachments')
@Index(['messageId'])
export class ChatMessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  messageId!: string;

  @Column()
  key!: string;

  @Column({ type: 'text' })
  url!: string;

  @Column()
  mimeType!: string;

  @Column()
  originalName!: string;

  @Column({ type: 'bigint' })
  size!: number;

  @Column({
    type: 'enum',
    enum: ChatAttachmentType,
  })
  attachmentType!: ChatAttachmentType;

  @ManyToOne(() => ChatMessage, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message!: ChatMessage;

  @CreateDateColumn()
  createdAt!: Date;
}
