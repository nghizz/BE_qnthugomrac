import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsModuleService } from './notifications-module.service';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CreatePointStatusNotificationDto } from './dto/notification.dto';
import { AuthGuard } from '../auth-module/auth.guard';
import { Request } from 'express';

// Thêm interface để type cho request
interface RequestWithUser extends Request {
  user: {
    id: number;
    // các thuộc tính khác của user nếu cần
  };
}

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class NotificationsModuleController {
  constructor(
    private readonly notificationsService: NotificationsModuleService,
  ) {}

  @Get('pending')
  async findAllPending() {
    return this.notificationsService.findAllPending();
  }

  @Patch(':id')
  async updateNotificationStatus(
    @Param('id') id: string,
    @Body() updateDto: { status: boolean },
  ) {
    return this.notificationsService.updateNotificationStatus(
      Number(id),
      updateDto,
    );
  }

  @Get('my-notifications')
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyNotifications(
    @Req() req: RequestWithUser,
    @Query('userId') queryUserId?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const userId = queryUserId || req.user?.id;

    if (!userId) {
      throw new BadRequestException('Invalid user ID');
    }

    return await this.notificationsService.getUserNotifications(
      userId,
      page,
      limit,
    );
  }

  @Get('my-unread-count')
  async getMyUnreadCount(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return await this.notificationsService.getUnreadCount(userId);
  }

  @Get('my-notifications/by-status/:pointStatus')
  async getMyNotificationsByPointStatus(
    @Req() req: RequestWithUser,
    @Param('pointStatus') pointStatus: 'pending' | 'approved' | 'rejected',
  ) {
    const userId = req.user.id;
    return await this.notificationsService.getNotificationsByPointStatus(
      userId,
      pointStatus,
    );
  }

  @Patch(':id/mark-read')
  async markAsRead(
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () =>
          new BadRequestException('Invalid notification ID'),
      }),
    )
    id: number,
  ) {
    return await this.notificationsService.markAsRead(id);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return await this.notificationsService.markAllAsRead(userId);
  }

  @Post('point-status')
  async createPointStatusNotification(
    @Body() createDto: CreatePointStatusNotificationDto,
  ) {
    return await this.notificationsService.createPointStatusNotification(
      createDto,
    );
  }

  @Get('user/:userId')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserNotifications(
    @Param(
      'userId',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: () => new BadRequestException('Invalid user ID'),
      }),
    )
    userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return await this.notificationsService.getUserNotifications(
      userId,
      page,
      limit,
    );
  }

  @Get('user/:userId/unread-count')
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    return await this.notificationsService.getUnreadCount(userId);
  }

  @Get('user/:userId/by-status/:pointStatus')
  async getNotificationsByPointStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('pointStatus') pointStatus: 'pending' | 'approved' | 'rejected',
  ) {
    return await this.notificationsService.getNotificationsByPointStatus(
      userId,
      pointStatus,
    );
  }

  @Get('my-latest')
  async getMyLatestNotifications(
    @Req() req: RequestWithUser,
    @Query('limit') limit: number = 5,
  ) {
    const userId = req.user.id;
    return await this.notificationsService.getLatestNotifications(
      userId,
      limit,
    );
  }
}
