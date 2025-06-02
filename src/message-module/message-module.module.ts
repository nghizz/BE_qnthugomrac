// src/message-module/message-module.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessageEntity } from './entities/message-module.entity'
import { MessageModuleService } from './message-module.service'
import { MessageModuleController } from './message-module.controller'
import { MessageModuleGateway } from './message-module.gateway'
import { AuthModule } from 'src/auth-module/auth-module.module'
import { User } from 'src/auth-module/auth.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity, User]), AuthModule],
  controllers: [MessageModuleController],
  providers: [MessageModuleService, MessageModuleGateway],
})
export class MessageModule {}
