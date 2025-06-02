import {
  Controller,
  UseGuards,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
} from '@nestjs/common'
import { AuthGuard } from '../auth-module/auth.guard'
import { MessageModuleService } from './message-module.service'
import { CreateMessageDto } from './dto/create-message-module.dto'
import { UpdateMessageDto } from './dto/update-message-module.dto'
import { ApiBearerAuth } from '@nestjs/swagger'

@ApiBearerAuth()
@Controller('messages')
@UseGuards(AuthGuard)
export class MessageModuleController {
  constructor(private readonly msgService: MessageModuleService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateMessageDto) {
    console.log('>>> user:', req.user)
    return this.msgService.create(dto, req.user)
  }

  @Get('conversation/:otherId')
  getConversation(@Req() req: any, @Param('otherId') otherId: string) {
    const me = req.user.id
    return this.msgService.findConversation(me, +otherId)
  }

  @Patch(':id')
  markRead(@Param('id') id: string, @Body() dto: UpdateMessageDto) {
    return this.msgService.update(+id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.msgService.remove(+id)
  }

  @Get('conversations')
  getConversations(@Req() req: any) {
    const { id, role } = req.user
    return this.msgService.getConversationsForUser(id, role)
  }
}
