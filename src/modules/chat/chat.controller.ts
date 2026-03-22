import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';
import { MulterExceptionFilter } from 'src/modules/s3/multer-exception.filter';
import { UserRole } from 'src/modules/users/enums/user-role.enum';
import { ChatService } from './chat.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { ListChatMessagesDto } from './dto/list-chat-messages.dto';
import { ListChatRoomsDto } from './dto/list-chat-rooms.dto';
import { SendAttachmentMessageDto } from './dto/send-attachment-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(MulterExceptionFilter)
@Roles(UserRole.CUSTOMER, UserRole.INFLUENCER, UserRole.ADMIN)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Create or get a chat room for a booking' })
  createRoom(
    @CurrentUser() currentUser: JwtPayload,
    @Body() createChatRoomDto: CreateChatRoomDto,
  ) {
    return this.chatService.createOrGetRoom(currentUser, createChatRoomDto);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List chat rooms for the current user' })
  findRooms(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListChatRoomsDto,
  ) {
    return this.chatService.findRooms(currentUser, query);
  }

  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Get chat room details by ID' })
  getRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.chatService.getRoom(roomId, currentUser);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'List paginated room messages' })
  getMessages(
    @Param('roomId') roomId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: ListChatMessagesDto,
  ) {
    return this.chatService.getMessages(roomId, currentUser, query);
  }

  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Send a text message' })
  sendMessage(
    @Param('roomId') roomId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(roomId, currentUser, sendMessageDto);
  }

  @Post('rooms/:roomId/messages/attachments')
  @ApiOperation({
    summary: 'Send images, videos, gifs, PDFs, or documents in chat',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        text: {
          type: 'string',
          description: 'Optional message text sent together with attachments.',
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  sendAttachmentMessage(
    @Param('roomId') roomId: string,
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFiles() files: any[],
    @Body() sendAttachmentMessageDto: SendAttachmentMessageDto,
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one attachment is required.');
    }

    return this.chatService.sendAttachmentMessage(
      roomId,
      currentUser,
      sendAttachmentMessageDto,
      files,
    );
  }

  @Patch('messages/:messageId')
  @ApiOperation({ summary: 'Edit a chat message sent by the current user' })
  updateMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Body() updateChatMessageDto: UpdateChatMessageDto,
  ) {
    return this.chatService.updateMessage(
      messageId,
      currentUser,
      updateChatMessageDto,
    );
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a chat message sent by the current user' })
  deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.chatService.deleteMessage(messageId, currentUser);
  }

  @Patch('rooms/:roomId/read')
  @ApiOperation({ summary: 'Mark all unread messages in a room as read' })
  markRoomAsRead(
    @Param('roomId') roomId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.chatService.markRoomAsRead(roomId, currentUser);
  }
}
