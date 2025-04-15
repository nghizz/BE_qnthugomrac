// src/notifications-module/notifications-module.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Notification } from './notifications.entity';
import {
  CreateNotificationDto,
  CreatePointStatusNotificationDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsModuleService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Tạo một thông báo mới.
   * @param createDto - Dữ liệu để tạo thông báo.
   * @param manager - EntityManager tùy chọn để sử dụng trong giao dịch.
   * @returns Thông báo đã được tạo.
   */
  async createNotification(
    createDto: CreateNotificationDto,
    manager?: EntityManager,
  ): Promise<Notification> {
    // Kiểm tra các trường bắt buộc
    if (
      !createDto.userId ||
      !createDto.collectionPointId ||
      !createDto.message
    ) {
      throw new BadRequestException('Missing required fields');
    }

    // Sử dụng manager nếu được cung cấp, nếu không dùng repository mặc định
    const repo = manager
      ? manager.getRepository(Notification)
      : this.notificationRepository;

    // Tạo thực thể thông báo
    const notification = repo.create({
      userId: createDto.userId,
      collectionPointId: createDto.collectionPointId,
      message: createDto.message,
      status: false,
    });

    // Lưu thông báo và trả về kết quả
    return await repo.save(notification);
  }

  /**
   * Tìm tất cả các thông báo đang chờ xử lý (status = false).
   * @returns Danh sách các thông báo đang chờ.
   */
  async findAllPending(): Promise<Notification[]> {
    return await this.notificationRepository.find({ where: { status: false } });
  }

  /**
   * Cập nhật trạng thái của một thông báo.
   * @param id - ID của thông báo.
   * @param updateDto - Dữ liệu cập nhật (status).
   * @returns Thông báo đã được cập nhật.
   */
  async updateNotificationStatus(
    id: number,
    updateDto: { status: boolean },
  ): Promise<Notification> {
    await this.notificationRepository.update(id, updateDto);
    return await this.notificationRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Tìm một thông báo theo ID.
   * @param id - ID của thông báo.
   * @returns Thông báo tương ứng.
   */
  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification #${id} không tồn tại!`);
    }
    return notification;
  }

  /**
   * Lấy thông báo của một người dùng với phân trang.
   * @param userId - ID của người dùng.
   * @param page - Trang hiện tại.
   * @param limit - Số lượng thông báo trên mỗi trang.
   * @returns Danh sách thông báo và thông tin phân trang.
   */
  async getUserNotifications(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!userId || isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const skip = (page - 1) * limit;
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { userId },
        relations: ['collectionPoint'],
        order: { created_at: 'DESC' },
        skip,
        take: limit,
      });

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Đếm số lượng thông báo chưa đọc của một người dùng.
   * @param userId - ID của người dùng.
   * @returns Số lượng thông báo chưa đọc.
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, status: false },
    });
  }

  /**
   * Lấy thông báo theo trạng thái của điểm thu gom.
   * @param userId - ID của người dùng.
   * @param pointStatus - Trạng thái của điểm thu gom.
   * @returns Danh sách thông báo tương ứng.
   */
  async getNotificationsByPointStatus(
    userId: number,
    pointStatus: string,
  ): Promise<Notification[]> {
    return await this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.collectionPoint', 'collectionPoint')
      .where('notification.userId = :userId', { userId })
      .andWhere('collectionPoint.status = :pointStatus', { pointStatus })
      .orderBy('notification.created_at', 'DESC')
      .getMany();
  }

  /**
   * Đánh dấu một thông báo là đã đọc.
   * @param id - ID của thông báo.
   * @returns Thông báo đã được cập nhật.
   */
  async markAsRead(id: number): Promise<Notification> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid notification ID');
    }

    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }

    await this.notificationRepository.update(id, { status: true });
    return notification;
  }

  /**
   * Đánh dấu tất cả thông báo của một người dùng là đã đọc.
   * @param userId - ID của người dùng.
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, status: false },
      { status: true },
    );
  }

  /**
   * Lấy các thông báo mới nhất của một người dùng.
   * @param userId - ID của người dùng.
   * @param limit - Số lượng thông báo tối đa.
   * @returns Danh sách thông báo mới nhất.
   */
  async getLatestNotifications(
    userId: number,
    limit: number,
  ): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      relations: ['collectionPoint'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Tạo thông báo về trạng thái của điểm thu gom.
   * @param createDto - Dữ liệu để tạo thông báo.
   * @returns Thông báo đã được tạo.
   */
  async createPointStatusNotification(
    createDto: CreatePointStatusNotificationDto,
  ): Promise<Notification> {
    let message = '';
    switch (createDto.status) {
      case 'approved':
        message = `Điểm thu gom "${createDto.pointName}" của bạn đã được phê duyệt.`;
        break;
      case 'rejected':
        message = `Điểm thu gom "${createDto.pointName}" của bạn đã bị từ chối.`;
        break;
      case 'pending':
        message = `Điểm thu gom "${createDto.pointName}" của bạn đang chờ duyệt.`;
        break;
    }

    const notification = this.notificationRepository.create({
      userId: createDto.userId,
      collectionPointId: createDto.collectionPointId,
      message: message,
      status: false, // chưa đọc
    });

    return await this.notificationRepository.save(notification);
  }
  async deleteByCollectionPointId(collectionPointId: number): Promise<void> {
    await this.notificationRepository.delete({ collectionPointId });
  }
}
