import { IsInt, IsString, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateMessageDto {
  @IsOptional()
  @IsInt()
  @ApiProperty({ example: 'senderId', required: false })
  senderId?: number

  @IsInt()
  @ApiProperty({ example: 'receiverId' })
  receiverId: number

  @IsString()
  @ApiProperty({ example: 'content' })
  content: string
}
