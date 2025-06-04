// src/message-module/message-module.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  // Bỏ AuthGuard import ở đây nếu không dùng @UseGuards ở cấp class
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { MessageModuleService } from './message-module.service'
import { CreateMessageDto } from './dto/create-message-module.dto'
import { UserRole } from '../auth-module/auth.entity'
// Import JwtService và Logger trực tiếp vào Gateway
import { JwtService } from '@nestjs/jwt'
import { Logger, UseGuards } from '@nestjs/common'
import { UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { AuthGuard } from 'src/auth-module/auth.guard'

interface UserPayload {
  id: number
  role: UserRole
  username: string
}

type AuthenticatedSocket = Socket & {
  data: {
    user?: UserPayload // user có thể undefined lúc đầu
  }
}

@WebSocketGateway({
  namespace: '/chat',
  path: '/socket.io',
  cors: { origin: 'https://map-thugomrac.vercel.app', credentials: true },
})
// Bỏ dòng này đi nếu không dùng AuthGuard cho @SubscribeMessage
// @UseGuards(AuthGuard)
export class MessageModuleGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server
  private activeSockets = new Map<number, string>()
  // Sử dụng Logger trong Gateway
  private readonly logger = new Logger(MessageModuleGateway.name)

  // Inject JwtService vào constructor
  constructor(
    private readonly chatService: MessageModuleService,
    private readonly jwtService: JwtService, // Inject JwtService
  ) {}

  handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    // Bỏ dòng log cũ
    // console.log('[Gateway] client.data.user:', client.data.user);

    // --- Bắt đầu xác thực token trong handleConnection ---
    const token =
      client.handshake.auth?.token || (client.handshake.query?.token as string)

    if (!token) {
      this.logger.warn(
        `WS connection rejected: Missing token for client=${client.id}`,
      )
      client.disconnect()
      return
    }

    try {
      const payload: any = this.jwtService.verify(token)
      // Gán user vào client.data SAU KHI xác thực thành công
      client.data.user = {
        id: Number(payload.sub), // Đảm bảo là number nếu cần
        role: payload.role,
        username: payload.username,
      }
      // --- Kết thúc xác thực token ---

      // Logic kết nối thành công (giữ nguyên)
      const { user } = client.data // Lấy user lại sau khi gán
      if (!user || !user.id) {
        // Kiểm tra lại user sau khi gán (chỉ để phòng)
        this.logger.error(
          `WS connection rejected: User payload invalid after verify for client=${client.id}`,
        )
        client.disconnect()
        return
      }

      this.logger.log(`WS connected: clientId=${client.id}, userId=${user.id}`)
      this.activeSockets.set(user.id, client.id)
      if (user.role === UserRole.ADMIN) client.join('admin')

      // Bỏ try/catch nếu đã thêm ở đây
      this.sendUnreadMessages(user.id, client.id) // Gọi hàm gửi tin nhắn chờ
    } catch (err) {
      // Xử lý lỗi xác thực (token hết hạn, không hợp lệ,...)
      this.logger.warn(
        `WS connection rejected: Auth failed for client=${client.id}. Error: ${err.message}`,
      )
      client.disconnect() // Ngắt kết nối nếu xác thực thất bại
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    // Chỉ log và xóa socket nếu user đã được gán thành công trước đó
    const { user } = client.data
    if (!user || !user.id) {
      this.logger.warn(
        `WS disconnected (unauthenticated): clientId=${client.id}`,
      )
      return
    }
    this.logger.log(`WS disconnected: clientId=${client.id}, userId=${user.id}`)
    this.activeSockets.delete(user.id)
  }

  @SubscribeMessage('message')
  @UseGuards(AuthGuard)
  async onMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { user } = client.data // User đã có do AuthGuard ở đây gán
    if (!user || !user.id) {
      // Trường hợp này không xảy ra nếu @UseGuards hoạt động đúng
      throw new UnauthorizedException('User not authenticated for message')
    }
    const senderId = user.id
    const saved = await this.chatService.create(
      { receiverId: data.receiverId, content: data.content },
      user, // Truyền object user đầy đủ nếu service cần
    )

    const payload = {
      id: saved.id,
      senderId,
      receiverId: saved.receiverId,
      content: saved.content,
      createdAt: saved.createdAt,
      isRead: saved.isRead,
    }

    const ADMIN_ID = 2 // hoặc lấy từ config
    // Gửi đến admin nếu liên quan
    if (
      [ADMIN_ID, senderId].includes(payload.receiverId) ||
      senderId === ADMIN_ID
    ) {
      this.server.to('admin').emit('message', payload)
    }
    // Gửi đến user còn lại
    const targetId =
      payload.receiverId === ADMIN_ID ? payload.senderId : payload.receiverId
    const sockId = this.activeSockets.get(targetId)
    if (sockId) {
      this.server.to(sockId).emit('message', payload)
    } else {
      console.log(`User ${targetId} not online, message saved`)
    }
  }

  @SubscribeMessage('getConversations')
  @UseGuards(AuthGuard)
  async onGetConversations(@ConnectedSocket() client: AuthenticatedSocket) {
    const { user } = client.data
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated')
    }
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admin can get conversations list')
    }

    // TODO: Service method getConversationsForUser needs to be updated
    // in MessageModuleService to return Array<{ id: number, username: string }>
    // for admin role, excluding the admin's own user object.
    const conversations = await this.chatService.getConversationsForUser(
      user.id,
      user.role,
    )

    // Assuming the service now returns [{ id: 1, username: 'user1' }, { id: 2, username: 'user2' }, ...]
    // We emit the list directly to the client.
    client.emit('conversations', conversations)
  }

  // New handler for regular users to get conversation with admin
  @SubscribeMessage('getUserConversationWithAdmin')
  @UseGuards(AuthGuard) // Ensure user is authenticated
  async onGetUserConversationWithAdmin(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { user } = client.data
    // Kiểm tra xem user và user.id có tồn tại không
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated')
    }
    const ADMIN_ID = 2 // Hoặc lấy từ cấu hình nếu admin ID có thể thay đổi

    // Đảm bảo đây là người dùng thường yêu cầu lịch sử chat của họ với admin
    // và không phải admin tự gọi endpoint này
    if (user?.role === UserRole.ADMIN || user?.id === ADMIN_ID) {
      throw new ForbiddenException(
        'Admins should use loadConversation endpoint',
      )
    }

    // Tìm cuộc hội thoại giữa người dùng hiện tại và admin
    const messages = await this.chatService.findConversation(user.id, ADMIN_ID)

    // Gửi lịch sử tin nhắn về lại cho socket của người dùng
    client.emit('userConversationHistory', messages)
    this.logger.log(
      `User ${user.id} fetched conversation history with admin ${ADMIN_ID}`,
    )
  }

  @SubscribeMessage('loadConversation')
  @UseGuards(AuthGuard)
  async onLoadConversation(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { user } = client.data
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated')
    }
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admin can load conversations')
    }

    const messages = await this.chatService.findConversation(
      user.id,
      data.userId,
    )
    client.emit('conversationHistory', messages)
  }

  private async sendUnreadMessages(userId: number, sockId: string) {
    // Thêm try/catch chi tiết nếu chưa có
    try {
      // ChatService phải có method này, xem bước 3
      const unread = await this.chatService.getUnreadMessages(userId)
      unread.forEach(msg => {
        // Đảm bảo format message gửi đi khớp với FE mong đợi
        this.server.to(sockId).emit('message', msg)
      })
    } catch (e) {
      this.logger.error(`Error sending unread messages for user ${userId}:`, e)
      // Có thể chọn disconnect client ở đây nếu lỗi gửi tin nhắn chờ là nghiêm trọng
      // this.server.sockets.sockets.get(sockId)?.disconnect();
    }
  }
}
