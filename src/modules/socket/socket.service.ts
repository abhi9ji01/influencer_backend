import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class SocketService {
  private status = 'initializing';
  private connectedClients = 0;

  constructor(private readonly logger: AppLoggerService) {}

  markReady(): void {
    this.status = 'ready';
    this.logger.info('Socket gateway is ready.', SocketService.name);
  }

  markClientConnected(clientId: string): void {
    this.connectedClients += 1;
    this.status = 'connected';
    this.logger.info(
      `Socket client connected: ${clientId}. Active clients: ${this.connectedClients}`,
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

  getStatus(): string {
    return this.status;
  }

  getConnectedClients(): number {
    return this.connectedClients;
  }
}
