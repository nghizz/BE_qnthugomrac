import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards, NotFoundException } from '@nestjs/common'; // <-- import từ common
import type { Server, Socket } from 'socket.io';
import { MessageModuleService } from './message-module.service';
import { CreateMessageDto } from './dto/create-message-module.dto';
import { AuthGuard } from '../auth-module/auth.guard';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
@UseGuards(AuthGuard) // <-- đúng import
export class MessageModuleGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeSockets = new Map<number, string>();

  constructor(private readonly chatService: MessageModuleService) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    this.activeSockets.set(user.id, client.id);
    if (user.role === 'admin') {
      client.join('admin');
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    this.activeSockets.delete(user.id);
  }

  @SubscribeMessage('message')
  async onMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const sender = client.data.user;
    // Tạo và lưu message
    const saved = await this.chatService.create({
      senderId: sender.id,
      receiverId: data.receiverId,
      content: data.content,
    });

    const payload = {
      id: saved.id,
      senderId: sender.id,
      receiverId: saved.receiverId,
      content: saved.content,
      createdAt: saved.createdAt,
      isRead: saved.isRead,
    };

    // Thay ADMIN_ID = 2 hoặc lấy từ config/env
    const ADMIN_ID = 2;
    if (data.receiverId === ADMIN_ID) {
      // Gửi đến tất cả socket trong room 'admin'
      this.server.to('admin').emit('message', payload);
    } else {
      // Gửi đến đúng user nhận
      const targetSocket = this.activeSockets.get(data.receiverId);
      if (!targetSocket) {
        throw new NotFoundException(
          `User socket ${data.receiverId} not online`,
        );
      }
      this.server.to(targetSocket).emit('message', payload);
      // Và admin cũng nhận tin
      this.server.to('admin').emit('message', payload);
    }
  }
}
