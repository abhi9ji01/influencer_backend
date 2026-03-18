import { Global, Module } from '@nestjs/common';
import { AppSocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Global()
@Module({
  providers: [SocketService, AppSocketGateway],
  exports: [SocketService],
})
export class SocketModule {}
