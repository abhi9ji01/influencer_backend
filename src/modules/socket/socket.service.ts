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

  getStatus(): string {
    return this.status;
  }

  getConnectedClients(): number {
    return this.connectedClients;
  }
}
