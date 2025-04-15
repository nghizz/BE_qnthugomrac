import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModuleService } from './notifications-module.service';
import { NotificationsModuleController } from './notifications-module.controller';
import { Notification } from './notifications.entity';
import { AuthModule } from 'src/auth-module/auth-module.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    AuthModule, // Import nếu có AuthGuard trong Controller
  ],
  controllers: [NotificationsModuleController],
  providers: [NotificationsModuleService],
  exports: [NotificationsModuleService],
})
export class NotificationsModule {}
