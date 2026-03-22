import { Global, Module } from '@nestjs/common';
import { AppJwtModule } from 'src/common/jwt/jwt.module';
import { ChatModule } from '../chat/chat.module';
import { AppSocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Global()
@Module({
  imports: [AppJwtModule, ChatModule],
  providers: [SocketService, AppSocketGateway],
  exports: [SocketService],
})
export class SocketModule {}
