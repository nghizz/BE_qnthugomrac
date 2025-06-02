// src/notifications-module/dto/notification.dto.ts
import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 'userId' })
  userId: number;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 'collectionPointId' })
  collectionPointId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'message' })
  message: string;
}

export class UpdateNotificationDto {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ example: 'status' })
  status: boolean;
}

export class CreatePointStatusNotificationDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 'userId' })
  userId: number;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 'collectionPointId' })
  collectionPointId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'pointName' })
  pointName: string;

  @IsEnum(['pending', 'approved', 'rejected'])
  @ApiProperty({ example: 'status' })
  status: 'pending' | 'approved' | 'rejected';
}
