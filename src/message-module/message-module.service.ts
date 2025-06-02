// src/message-module/message-module.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MessageEntity } from './entities/message-module.entity'
import { CreateMessageDto } from './dto/create-message-module.dto'
import { UpdateMessageDto } from './dto/update-message-module.dto'
// Import UserEntity - Điều chỉnh đường dẫn nếu cần
import { User } from 'src/auth-module/auth.entity'

@Injectable()
export class MessageModuleService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly msgRepo: Repository<MessageEntity>,
    @InjectRepository(User) // <-- Inject UserEntity Repository
    private readonly userRepo: Repository<User>, // <-- Thêm userRepo với tên biến userRepo
  ) {}

  private readonly logger = new Logger(MessageModuleService.name)

  async create(dto: CreateMessageDto, user: { id: number; role: string }) {
    const adminId = 2 // hoặc lấy từ config

    // Thêm log để kiểm tra role và receiverId khi create được gọi
    this.logger.log(
      `[create] User ${user.id} (Role: ${user.role}) attempting to message receiverId=${dto.receiverId}`,
    )

    // Điều kiện: Nếu user không phải ADMIN VÀ người nhận không phải ADMIN, thì báo lỗi Forbidden
    if (user.role !== 'admin' && dto.receiverId !== adminId) {
      this.logger.warn(
        `[create] Forbidden: User ${user.id} (Role: ${user.role}) attempted to message non-admin ${dto.receiverId}`,
      )
      throw new ForbiddenException('Người dùng chỉ được nhắn tin cho admin.')
    }

    // Nếu user là ADMIN, hoặc user là người dùng thường nhưng nhắn cho ADMIN, thì cho phép tạo tin nhắn
    this.logger.log(
      `[create] Allowed: Creating message from userId=${user.id} to receiverId=${dto.receiverId}`,
    )

    const msg = this.msgRepo.create({
      senderId: user.id,
      receiverId: dto.receiverId,
      content: dto.content,
    })

    try {
      const saved = await this.msgRepo.save(msg)
      this.logger.debug(`[create] Message saved: ${JSON.stringify(saved)}`)
      return saved
    } catch (error) {
      this.logger.error(
        `[create] Error saving message: ${error.message}`,
        error.stack,
      )
      throw error // Re-throw the error
    }
  }

  async findConversation(
    userA: number,
    userB: number,
  ): Promise<MessageEntity[]> {
    return this.msgRepo.find({
      where: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
      order: { createdAt: 'ASC' },
    })
  }

  async update(id: number, dto: UpdateMessageDto): Promise<MessageEntity> {
    // Cách 1: dùng update + findOne + kiểm tra null
    await this.msgRepo.update(id, dto)
    const message = await this.msgRepo.findOneBy({ id })
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`)
    }
    return message

    // Cách 2 (thường dùng preload):
    // const preload = await this.msgRepo.preload({ id, ...dto });
    // if (!preload) throw new NotFoundException(`Message ${id} not found`);
    // return this.msgRepo.save(preload);
  }

  async remove(id: number): Promise<void> {
    await this.msgRepo.delete(id)
  }

  async getConversationsForUser(userId: number, role: string) {
    if (role === 'admin') {
      // <-- Sửa 'admin' thành 'ADMIN' nếu UserRole.ADMIN là 'ADMIN'
      // 1. Tìm các user ID khác admin có liên quan đến tin nhắn của admin
      const userIdsResult = await this.msgRepo
        .createQueryBuilder('msg')
        .select(
          'DISTINCT CASE WHEN msg.senderId = :adminId THEN msg.receiverId ELSE msg.senderId END',
          'userId',
        )
        .where('msg.senderId = :adminId OR msg.receiverId = :adminId', {
          adminId: userId,
        })
        .andWhere(
          'CASE WHEN msg.senderId = :adminId THEN msg.receiverId ELSE msg.senderId END != :adminId',
          { adminId: userId },
        ) // <-- Loại trừ ID của admin
        .getRawMany()

      const conversationUserIds = userIdsResult.map(r => r.userId)

      if (conversationUserIds.length === 0) {
        return [] // Trả về mảng rỗng nếu không có user nào khác admin
      }

      // 2. Lấy thông tin username của các user này từ bảng users
      // Sử dụng this.userRepo (tên biến đã inject) thay vì this.userRepository
      const conversationUsers = await this.userRepo
        .createQueryBuilder('user')
        .select(['user.id', 'user.username']) // <-- Chỉ chọn id và username
        .whereInIds(conversationUserIds) // <-- Lọc theo các user ID đã tìm được
        .getMany() // <-- Lấy về mảng các UserEntity object

      // 3. Trả về mảng các đối tượng { id, username }
      return conversationUsers.map(user => ({
        id: user.id,
        username: user.username,
      }))
    } else {
      // Logic cho user thường
      const adminId = 2 // hoặc lấy từ env/config
      // Truy vấn user admin để lấy username nếu user thường chat với admin
      const adminUser = await this.userRepo.findOneBy({ id: adminId })
      return adminUser
        ? [{ id: adminUser.id, username: adminUser.username }]
        : []
    }
  }

  async getUnreadMessages(userId: number): Promise<MessageEntity[]> {
    return this.msgRepo.find({
      where: { receiverId: userId, isRead: false },
      order: { createdAt: 'ASC' },
    })
  }
}
