import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { S3Service } from 'src/modules/s3/s3.service';
import { SocketService } from 'src/modules/socket/socket.service';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { ListChatMessagesDto } from './dto/list-chat-messages.dto';
import { ListChatRoomsDto } from './dto/list-chat-rooms.dto';
import { SendAttachmentMessageDto } from './dto/send-attachment-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { ChatAttachmentType } from './enums/chat-attachment-type.enum';
import { ChatMessageType } from './enums/chat-message-type.enum';
import { ChatMessageAttachment } from './entities/chat-message-attachment.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomsRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly chatMessagesRepository: Repository<ChatMessage>,
    @InjectRepository(ChatMessageAttachment)
    private readonly chatAttachmentsRepository: Repository<ChatMessageAttachment>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly s3Service: S3Service,
    private readonly socketService: SocketService,
    private readonly logger: AppLoggerService,
  ) {}

  async createOrGetRoom(
    currentUser: JwtPayload,
    createChatRoomDto: CreateChatRoomDto,
  ) {
    const existingRoom = await this.chatRoomsRepository.findOne({
      where: { bookingId: createChatRoomDto.bookingId },
      relations: this.roomRelations,
    });

    if (existingRoom) {
      this.ensureRoomAccess(existingRoom, currentUser);
      return existingRoom;
    }

    const booking = await this.getAuthorizedBooking(
      createChatRoomDto.bookingId,
      currentUser,
    );

    const room = this.chatRoomsRepository.create({
      bookingId: booking.id,
      customerId: booking.campaign.customerId,
      influencerId: booking.influencerId,
      influencerUserId: booking.influencer.userId,
    });

    const savedRoom = await this.chatRoomsRepository.save(room);
    const hydratedRoom = await this.getRoomOrThrow(savedRoom.id, currentUser);

    this.socketService.emitChatRoomUpdated({
      roomId: hydratedRoom.id,
      bookingId: hydratedRoom.bookingId,
      customerId: hydratedRoom.customerId,
      influencerId: hydratedRoom.influencerId,
    });

    this.logger.info(
      `Chat room ${hydratedRoom.id} created for booking ${hydratedRoom.bookingId}.`,
      ChatService.name,
    );

    return hydratedRoom;
  }

  async findRooms(currentUser: JwtPayload, query: ListChatRoomsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.chatRoomsRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.booking', 'booking')
      .leftJoinAndSelect('booking.campaign', 'campaign')
      .leftJoinAndSelect('room.customer', 'customer')
      .leftJoinAndSelect('room.influencer', 'influencer')
      .leftJoinAndSelect('influencer.user', 'influencerUser');

    this.applyRoomAccessScope(queryBuilder, currentUser);

    if (query.bookingId) {
      queryBuilder.andWhere('room.bookingId = :bookingId', {
        bookingId: query.bookingId,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        `(
          LOWER(campaign.title) LIKE :search
          OR LOWER(customer.firstName) LIKE :search
          OR LOWER(customer.lastName) LIKE :search
          OR LOWER(influencerUser.firstName) LIKE :search
          OR LOWER(influencerUser.lastName) LIKE :search
        )`,
        {
          search: `%${query.search.toLowerCase()}%`,
        },
      );
    }

    queryBuilder
      .orderBy('COALESCE(room.lastMessageAt, room.createdAt)', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRoom(roomId: string, currentUser: JwtPayload) {
    return this.getRoomOrThrow(roomId, currentUser);
  }

  async validateSocketRoomAccess(roomId: string, currentUser: JwtPayload) {
    const room = await this.getRoomOrThrow(roomId, currentUser);
    return {
      roomId: room.id,
      bookingId: room.bookingId,
    };
  }

  async getMessages(
    roomId: string,
    currentUser: JwtPayload,
    query: ListChatMessagesDto,
  ) {
    await this.getRoomOrThrow(roomId, currentUser);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.chatMessagesRepository.findAndCount({
      where: {
        roomId,
      },
      relations: ['sender', 'attachments'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: [...items].reverse(),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(
    roomId: string,
    currentUser: JwtPayload,
    sendMessageDto: SendMessageDto,
  ) {
    const room = await this.getRoomOrThrow(roomId, currentUser);
    const text = sendMessageDto.text.trim();

    if (!text) {
      throw new BadRequestException('Message text is required.');
    }

    const message = this.chatMessagesRepository.create({
      roomId: room.id,
      senderId: currentUser.sub,
      messageType: ChatMessageType.TEXT,
      text,
    });

    const savedMessage = await this.chatMessagesRepository.save(message);
    await this.updateRoomAfterMessage(
      room,
      currentUser.sub,
      text,
      savedMessage.id,
      savedMessage.createdAt,
    );

    const hydratedMessage = await this.getMessageOrThrow(savedMessage.id);
    this.emitMessageSent(room, hydratedMessage);

    this.logger.info(
      `Chat message ${hydratedMessage.id} sent in room ${room.id}.`,
      ChatService.name,
    );

    return hydratedMessage;
  }

  async sendAttachmentMessage(
    roomId: string,
    currentUser: JwtPayload,
    sendAttachmentMessageDto: SendAttachmentMessageDto,
    files: any[],
  ) {
    const room = await this.getRoomOrThrow(roomId, currentUser);
    const text = sendAttachmentMessageDto.text?.trim();

    if (!files?.length) {
      throw new BadRequestException('At least one attachment is required.');
    }

    const uploads = await this.s3Service.uploadFiles(
      files,
      `chat/rooms/${room.id}`,
    );
    const messageType = this.resolveMessageTypeFromUploads(uploads);

    const message = this.chatMessagesRepository.create({
      roomId: room.id,
      senderId: currentUser.sub,
      messageType,
      text: text || undefined,
    });

    const savedMessage = await this.chatMessagesRepository.save(message);

    const attachments = uploads.map((upload) =>
      this.chatAttachmentsRepository.create({
        messageId: savedMessage.id,
        key: upload.key,
        url: upload.url,
        mimeType: upload.mimeType,
        originalName: upload.originalName,
        size: upload.size,
        attachmentType: this.resolveAttachmentType(upload.mimeType),
      }),
    );

    await this.chatAttachmentsRepository.save(attachments);

    const preview =
      text || `Sent ${uploads.length} attachment${uploads.length > 1 ? 's' : ''}`;

    await this.updateRoomAfterMessage(
      room,
      currentUser.sub,
      preview,
      savedMessage.id,
      savedMessage.createdAt,
    );

    const hydratedMessage = await this.getMessageOrThrow(savedMessage.id);
    this.emitMessageSent(room, hydratedMessage);

    this.logger.info(
      `Attachment message ${hydratedMessage.id} sent in room ${room.id}.`,
      ChatService.name,
    );

    return hydratedMessage;
  }

  async updateMessage(
    messageId: string,
    currentUser: JwtPayload,
    updateChatMessageDto: UpdateChatMessageDto,
  ) {
    const message = await this.getMessageOrThrow(messageId);
    const room = await this.getRoomOrThrow(message.roomId, currentUser);
    this.ensureMessageMutationAccess(message, currentUser);

    if (message.deletedAt) {
      throw new BadRequestException('Deleted messages cannot be edited.');
    }

    const text = updateChatMessageDto.text.trim();
    if (!text) {
      throw new BadRequestException('Updated message text is required.');
    }

    message.text = text;
    message.isEdited = true;

    await this.chatMessagesRepository.save(message);
    await this.syncRoomPreviewForMessage(room, message, text);

    const hydratedMessage = await this.getMessageOrThrow(message.id);

    this.socketService.emitChatMessageUpdated({
      roomId: room.id,
      bookingId: room.bookingId,
      message: hydratedMessage,
    });

    return hydratedMessage;
  }

  async deleteMessage(messageId: string, currentUser: JwtPayload) {
    const message = await this.getMessageOrThrow(messageId);
    const room = await this.getRoomOrThrow(message.roomId, currentUser);
    this.ensureMessageMutationAccess(message, currentUser);

    if (message.deletedAt) {
      throw new BadRequestException('Message is already deleted.');
    }

    const attachmentKeys = message.attachments.map((attachment) => attachment.key);
    if (attachmentKeys.length) {
      await this.s3Service.deleteFiles(attachmentKeys);
      await this.chatAttachmentsRepository.delete({ messageId: message.id });
    }

    message.text = 'Message deleted';
    message.deletedAt = new Date();
    message.isEdited = false;

    await this.chatMessagesRepository.save(message);
    await this.syncRoomPreviewForMessage(room, message, 'Message deleted');

    const hydratedMessage = await this.getMessageOrThrow(message.id);

    this.socketService.emitChatMessageDeleted({
      roomId: room.id,
      bookingId: room.bookingId,
      message: hydratedMessage,
    });

    return hydratedMessage;
  }

  async markRoomAsRead(roomId: string, currentUser: JwtPayload) {
    const room = await this.getRoomOrThrow(roomId, currentUser);
    const readAt = new Date();

    await this.chatMessagesRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ readAt })
      .where('roomId = :roomId', { roomId })
      .andWhere('senderId != :senderId', { senderId: currentUser.sub })
      .andWhere('readAt IS NULL')
      .execute();

    if (currentUser.role === UserRole.CUSTOMER) {
      room.customerUnreadCount = 0;
      await this.chatRoomsRepository.save(room);
    }

    if (currentUser.role === UserRole.INFLUENCER) {
      room.influencerUnreadCount = 0;
      await this.chatRoomsRepository.save(room);
    }

    this.socketService.emitChatMessageRead({
      roomId: room.id,
      readBy: currentUser.sub,
      readAt: readAt.toISOString(),
    });

    this.socketService.emitChatRoomUpdated({
      roomId: room.id,
      customerUnreadCount: room.customerUnreadCount,
      influencerUnreadCount: room.influencerUnreadCount,
    });

    return {
      roomId: room.id,
      readAt,
    };
  }

  private async getAuthorizedBooking(
    bookingId: string,
    currentUser: JwtPayload,
  ) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['campaign', 'influencer', 'influencer.user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isCustomer =
      currentUser.role === UserRole.CUSTOMER &&
      booking.campaign.customerId === currentUser.sub;
    const isInfluencer =
      currentUser.role === UserRole.INFLUENCER &&
      booking.influencer.userId === currentUser.sub;

    if (!isAdmin && !isCustomer && !isInfluencer) {
      throw new ForbiddenException(
        'You do not have access to this booking chat.',
      );
    }

    return booking;
  }

  private async getRoomOrThrow(roomId: string, currentUser: JwtPayload) {
    const room = await this.chatRoomsRepository.findOne({
      where: { id: roomId },
      relations: this.roomRelations,
    });

    if (!room) {
      throw new NotFoundException('Chat room not found.');
    }

    this.ensureRoomAccess(room, currentUser);
    return room;
  }

  private async getMessageOrThrow(messageId: string) {
    const message = await this.chatMessagesRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'attachments'],
    });

    if (!message) {
      throw new NotFoundException('Chat message not found.');
    }

    return message;
  }

  private ensureRoomAccess(room: ChatRoom, currentUser: JwtPayload): void {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (
      currentUser.role === UserRole.CUSTOMER &&
      room.customerId === currentUser.sub
    ) {
      return;
    }

    if (
      currentUser.role === UserRole.INFLUENCER &&
      room.influencerUserId === currentUser.sub
    ) {
      return;
    }

    throw new ForbiddenException('You do not have access to this chat room.');
  }

  private ensureMessageMutationAccess(
    message: ChatMessage,
    currentUser: JwtPayload,
  ): void {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (message.senderId !== currentUser.sub) {
      throw new ForbiddenException(
        'You can only edit or delete your own chat messages.',
      );
    }
  }

  private applyRoomAccessScope(
    queryBuilder: any,
    currentUser: JwtPayload,
  ): void {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.CUSTOMER) {
      queryBuilder.where('room.customerId = :customerId', {
        customerId: currentUser.sub,
      });
      return;
    }

    queryBuilder.where('room.influencerUserId = :influencerUserId', {
      influencerUserId: currentUser.sub,
    });
  }

  private async updateRoomAfterMessage(
    room: ChatRoom,
    senderId: string,
    preview: string,
    messageId: string,
    messageCreatedAt: Date,
  ) {
    room.lastMessageId = messageId;
    room.lastMessagePreview = preview.slice(0, 200);
    room.lastMessageAt = messageCreatedAt;

    if (senderId === room.customerId) {
      room.influencerUnreadCount += 1;
    } else if (senderId === room.influencerUserId) {
      room.customerUnreadCount += 1;
    }

    await this.chatRoomsRepository.save(room);

    this.socketService.emitChatRoomUpdated({
      roomId: room.id,
      bookingId: room.bookingId,
      lastMessageId: room.lastMessageId,
      lastMessagePreview: room.lastMessagePreview,
      lastMessageAt: room.lastMessageAt,
      customerUnreadCount: room.customerUnreadCount,
      influencerUnreadCount: room.influencerUnreadCount,
    });
  }

  private async syncRoomPreviewForMessage(
    room: ChatRoom,
    message: ChatMessage,
    preview: string,
  ) {
    if (room.lastMessageId !== message.id) {
      return;
    }

    room.lastMessagePreview = preview.slice(0, 200);
    await this.chatRoomsRepository.save(room);

    this.socketService.emitChatRoomUpdated({
      roomId: room.id,
      bookingId: room.bookingId,
      lastMessageId: room.lastMessageId,
      lastMessagePreview: room.lastMessagePreview,
      lastMessageAt: room.lastMessageAt,
      customerUnreadCount: room.customerUnreadCount,
      influencerUnreadCount: room.influencerUnreadCount,
    });
  }

  private emitMessageSent(room: ChatRoom, message: ChatMessage): void {
    this.socketService.emitChatMessageSent({
      roomId: room.id,
      bookingId: room.bookingId,
      message,
    });
  }

  private resolveMessageTypeFromUploads(
    uploads: Array<{ mimeType: string }>,
  ): ChatMessageType {
    const attachmentTypes = new Set(
      uploads.map((upload) => this.resolveAttachmentType(upload.mimeType)),
    );

    if (attachmentTypes.size > 1 || uploads.length > 1) {
      return ChatMessageType.MIXED;
    }

    const [attachmentType] = [...attachmentTypes];

    if (attachmentType === ChatAttachmentType.IMAGE) {
      return ChatMessageType.IMAGE;
    }

    if (attachmentType === ChatAttachmentType.VIDEO) {
      return ChatMessageType.VIDEO;
    }

    return ChatMessageType.DOCUMENT;
  }

  private resolveAttachmentType(mimeType: string): ChatAttachmentType {
    if (mimeType.startsWith('image/')) {
      return ChatAttachmentType.IMAGE;
    }

    if (mimeType.startsWith('video/')) {
      return ChatAttachmentType.VIDEO;
    }

    return ChatAttachmentType.DOCUMENT;
  }

  private get roomRelations(): string[] {
    return [
      'booking',
      'booking.campaign',
      'customer',
      'influencer',
      'influencer.user',
    ];
  }
}
