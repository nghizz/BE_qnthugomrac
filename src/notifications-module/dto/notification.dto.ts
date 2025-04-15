// src/notifications-module/dto/notification.dto.ts
import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  collectionPointId: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateNotificationDto {
  @IsBoolean()
  @IsNotEmpty()
  status: boolean;
}

export class CreatePointStatusNotificationDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  collectionPointId: number;

  @IsString()
  @IsNotEmpty()
  pointName: string;

  @IsEnum(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';
}
