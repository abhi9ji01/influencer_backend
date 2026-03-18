import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';

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

  constructor(private readonly socketService: SocketService) {}

  afterInit(): void {
    this.socketService.markReady();
  }

  handleConnection(client: Socket): void {
    this.socketService.markClientConnected(client.id);
  }

  handleDisconnect(client: Socket): void {
    this.socketService.markClientDisconnected(client.id);
  }
}
