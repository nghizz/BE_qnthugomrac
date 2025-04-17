import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from './entities/message-module.entity';
import { CreateMessageDto } from './dto/create-message-module.dto';
import { UpdateMessageDto } from './dto/update-message-module.dto';

@Injectable()
export class MessageModuleService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly msgRepo: Repository<MessageEntity>,
  ) {}

  async create(dto: CreateMessageDto): Promise<MessageEntity> {
    const msg = this.msgRepo.create(dto);
    return this.msgRepo.save(msg);
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
    });
  }

  async update(id: number, dto: UpdateMessageDto): Promise<MessageEntity> {
    // Cách 1: dùng update + findOne + kiểm tra null
    await this.msgRepo.update(id, dto);
    const message = await this.msgRepo.findOneBy({ id });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;

    // Cách 2 (thường dùng preload):
    // const preload = await this.msgRepo.preload({ id, ...dto });
    // if (!preload) throw new NotFoundException(`Message ${id} not found`);
    // return this.msgRepo.save(preload);
  }

  async remove(id: number): Promise<void> {
    await this.msgRepo.delete(id);
  }
}
