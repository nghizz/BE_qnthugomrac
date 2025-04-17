import { IsInt, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsInt()
  senderId: number;

  @IsInt()
  receiverId: number;

  @IsString()
  content: string;
}
