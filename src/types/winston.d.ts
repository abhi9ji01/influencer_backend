declare module 'winston';
declare module 'ioredis';
declare module '@sendgrid/mail';
declare module 'twilio';

declare module '@nestjs/websockets' {
  export const WebSocketGateway: any;
  export const WebSocketServer: any;
  export const SubscribeMessage: any;
  export const ConnectedSocket: any;
  export const MessageBody: any;
  export class WsException extends Error {
    constructor(message: string | object);
  }
  export interface OnGatewayInit {
    afterInit(...args: any[]): any;
  }
  export interface OnGatewayConnection {
    handleConnection(...args: any[]): any;
  }
  export interface OnGatewayDisconnect {
    handleDisconnect(...args: any[]): any;
  }
}

declare module 'socket.io' {
  export class Server {
    emit(event: string, payload?: any): void;
    to(room: string): {
      emit(event: string, payload?: any): void;
    };
  }

  export class Socket {
    id: string;
    data: Record<string, any>;
    handshake: {
      auth?: Record<string, any>;
      headers: Record<string, any>;
      query?: Record<string, any>;
    };
    emit(event: string, payload?: any): void;
    disconnect(close?: boolean): void;
    join(room: string): Promise<void> | void;
    leave(room: string): Promise<void> | void;
  }
}
