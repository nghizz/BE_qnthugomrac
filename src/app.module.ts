import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as dotenv from 'dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionPointModule } from './collection-point/collection-point.module';
import { AuthModule } from './auth-module/auth-module.module';
import { NotificationsModule } from './notifications-module/notifications-module.module';
import { MessageModule } from './message-module/message-module.module';


dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      ssl: {
        rejectUnauthorized: false // Chỉ sử dụng trong môi trường development
      },
    }),
    CollectionPointModule,
    AuthModule,
    NotificationsModule,
    MessageModule, //Component được tạo bằng lệnh: nest generate resource collection-point
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
