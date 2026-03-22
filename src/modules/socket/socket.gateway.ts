import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AppLoggerService } from 'src/common/logger/logger.service';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';
import { ChatService } from '../chat/chat.service';
import { SocketService } from './socket.service';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    user?: JwtPayload;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class AppSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly socketService: SocketService,
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly logger: AppLoggerService,
  ) {}

  afterInit(): void {
    this.socketService.setServer(this.server);
    this.socketService.markReady();
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const user = await this.authenticateClient(client);
      client.data.user = user;
      this.socketService.markClientConnected(client.id, user.email);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(
        `Socket authentication failed for client ${client.id}: ${err.message}`,
        AppSocketGateway.name,
      );
      client.emit('socket.error', { message: 'Unauthorized socket connection.' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.socketService.markClientDisconnected(client.id);
  }

  @SubscribeMessage('chat.room.join')
  async handleJoinChatRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { roomId?: string },
  ) {
    const user = this.getSocketUser(client);
    const roomId = body?.roomId?.trim();

    if (!roomId) {
      throw new WsException('roomId is required.');
    }

    await this.chatService.validateSocketRoomAccess(roomId, user);

    const channel = this.socketService.getChatRoomChannel(roomId);
    await client.join(channel);

    this.logger.info(
      `Socket client ${client.id} joined chat room ${roomId}.`,
      AppSocketGateway.name,
    );

    return {
      event: 'chat.room.joined',
      data: { roomId },
    };
  }

  @SubscribeMessage('chat.room.leave')
  async handleLeaveChatRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { roomId?: string },
  ) {
    const user = this.getSocketUser(client);
    const roomId = body?.roomId?.trim();

    if (!roomId) {
      throw new WsException('roomId is required.');
    }

    await this.chatService.validateSocketRoomAccess(roomId, user);

    const channel = this.socketService.getChatRoomChannel(roomId);
    await client.leave(channel);

    this.logger.info(
      `Socket client ${client.id} left chat room ${roomId}.`,
      AppSocketGateway.name,
    );

    return {
      event: 'chat.room.left',
      data: { roomId },
    };
  }

  @SubscribeMessage('chat.typing.start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { roomId?: string },
  ) {
    const user = this.getSocketUser(client);
    const roomId = body?.roomId?.trim();

    if (!roomId) {
      throw new WsException('roomId is required.');
    }

    await this.chatService.validateSocketRoomAccess(roomId, user);

    this.socketService.emitChatTypingStarted({
      roomId,
      userId: user.sub,
      email: user.email,
      role: user.role,
    });

    return {
      event: 'chat.typing.started',
      data: { roomId },
    };
  }

  @SubscribeMessage('chat.typing.stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { roomId?: string },
  ) {
    const user = this.getSocketUser(client);
    const roomId = body?.roomId?.trim();

    if (!roomId) {
      throw new WsException('roomId is required.');
    }

    await this.chatService.validateSocketRoomAccess(roomId, user);

    this.socketService.emitChatTypingStopped({
      roomId,
      userId: user.sub,
      email: user.email,
      role: user.role,
    });

    return {
      event: 'chat.typing.stopped',
      data: { roomId },
    };
  }

  private async authenticateClient(client: AuthenticatedSocket): Promise<JwtPayload> {
    const token = this.extractToken(client);

    if (!token) {
      throw new Error('Missing bearer token.');
    }

    return this.jwtService.verifyAsync<JwtPayload>(token);
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return this.normalizeToken(authToken);
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string' && authorization.trim()) {
      return this.normalizeToken(authorization);
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return this.normalizeToken(queryToken);
    }

    return null;
  }

  private normalizeToken(value: string): string {
    return value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim();
  }

  private getSocketUser(client: AuthenticatedSocket): JwtPayload {
    if (!client.data.user) {
      throw new WsException('Socket user is not authenticated.');
    }

    return client.data.user;
  }
}
