import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class SocketService {
  private server: any;
  private status = 'initializing';
  private connectedClients = 0;

  constructor(private readonly logger: AppLoggerService) {}

  setServer(server: any): void {
    this.server = server;
  }

  markReady(): void {
    this.status = 'ready';
    this.logger.info('Socket gateway is ready.', SocketService.name);
  }

  markClientConnected(clientId: string, userIdentifier?: string): void {
    this.connectedClients += 1;
    this.status = 'connected';
    this.logger.info(
      `Socket client connected: ${clientId}${userIdentifier ? ` (${userIdentifier})` : ''}. Active clients: ${this.connectedClients}`,
      SocketService.name,
    );
  }

  markClientDisconnected(clientId: string): void {
    this.connectedClients = Math.max(0, this.connectedClients - 1);
    this.status = this.connectedClients > 0 ? 'connected' : 'ready';
    this.logger.info(
      `Socket client disconnected: ${clientId}. Active clients: ${this.connectedClients}`,
      SocketService.name,
    );
  }

  emit(event: string, payload: Record<string, unknown>): void {
    if (!this.server) {
      this.logger.warn(
        `Socket event ${event} skipped because gateway server is not ready.`,
        SocketService.name,
      );
      return;
    }

    this.server.emit(event, payload);
    this.logger.info(`Socket event emitted: ${event}`, SocketService.name, {
      event,
      payload,
    });
  }

  emitToChatRoom(
    roomId: string,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    if (!this.server) {
      this.logger.warn(
        `Socket room event ${event} skipped because gateway server is not ready.`,
        SocketService.name,
      );
      return;
    }

    this.server.to(this.getChatRoomChannel(roomId)).emit(event, payload);
    this.logger.info(
      `Socket room event emitted: ${event} -> ${roomId}`,
      SocketService.name,
      {
        roomId,
        event,
        payload,
      },
    );
  }

  emitCampaignCreated(payload: Record<string, unknown>): void {
    this.emit('campaign.created', payload);
  }

  emitBookingCreated(payload: Record<string, unknown>): void {
    this.emit('booking.created', payload);
  }

  emitBookingUpdated(payload: Record<string, unknown>): void {
    this.emit('booking.updated', payload);
  }

  emitNotification(payload: Record<string, unknown>): void {
    this.emit('notification.send', payload);
  }

  emitChatRoomUpdated(payload: Record<string, unknown>): void {
    const roomId = this.extractRoomId(payload);
    if (!roomId) {
      this.emit('chat.room.updated', payload);
      return;
    }

    this.emitToChatRoom(roomId, 'chat.room.updated', payload);
  }

  emitChatMessageSent(payload: Record<string, unknown>): void {
    const roomId = this.extractRoomId(payload);
    if (!roomId) {
      this.emit('chat.message.sent', payload);
      return;
    }

    this.emitToChatRoom(roomId, 'chat.message.sent', payload);
  }

  emitChatMessageRead(payload: Record<string, unknown>): void {
    const roomId = this.extractRoomId(payload);
    if (!roomId) {
      this.emit('chat.message.read', payload);
      return;
    }

    this.emitToChatRoom(roomId, 'chat.message.read', payload);
  }

  emitChatMessageUpdated(payload: Record<string, unknown>): void {
    const roomId = this.extractRoomId(payload);
    if (!roomId) {
      this.emit('chat.message.updated', payload);
      return;
    }

    this.emitToChatRoom(roomId, 'chat.message.updated', payload);
  }

  emitChatMessageDeleted(payload: Record<string, unknown>): void {
    const roomId = this.extractRoomId(payload);
    if (!roomId) {
      this.emit('chat.message.deleted', payload);
      return;
    }

    this.emitToChatRoom(roomId, 'chat.message.deleted', payload);
  }

  emitChatTypingStarted(payload: Record<string, unknown>): void {
    const roomId = this.extractRoomId(payload);
    if (!roomId) {
      this.emit('chat.typing.started', payload);
      return;
    }

    this.emitToChatRoom(roomId, 'chat.typing.started', payload);
  }

  emitChatTypingStopped(payload: Record<string, unknown>): void {
    const roomId = this.extractRoomId(payload);
    if (!roomId) {
      this.emit('chat.typing.stopped', payload);
      return;
    }

    this.emitToChatRoom(roomId, 'chat.typing.stopped', payload);
  }

  getChatRoomChannel(roomId: string): string {
    return `chat-room:${roomId}`;
  }

  getStatus(): string {
    return this.status;
  }

  getConnectedClients(): number {
    return this.connectedClients;
  }

  private extractRoomId(payload: Record<string, unknown>): string | undefined {
    const roomId = payload.roomId;
    return typeof roomId === 'string' && roomId.trim() ? roomId : undefined;
  }
}
