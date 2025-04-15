import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionPoint } from './entities/collection-point.entity';
import { CollectionPointService } from './collection-point.service';
import { CollectionPointController } from './collection-point.controller';
import { AuthModule } from 'src/auth-module/auth-module.module';
import { NotificationsModule } from 'src/notifications-module/notifications-module.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionPoint]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [CollectionPointController],
  providers: [CollectionPointService],
})
export class CollectionPointModule {}
