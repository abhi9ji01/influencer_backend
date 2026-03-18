declare module 'winston';
declare module 'ioredis';

declare module '@nestjs/websockets' {
  export const WebSocketGateway: any;
  export const WebSocketServer: any;
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
  export class Server {}
  export class Socket {
    id: string;
  }
}
