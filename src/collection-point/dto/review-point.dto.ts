/* eslint-disable prettier/prettier */
// src/collection-points/dto/review-point.dto.ts
import { IsString, IsIn } from 'class-validator';

export class ReviewPointDto {
  @IsString()
  @IsIn(['approved', 'rejected'], {
    message: 'status phải là "approved" hoặc "rejected"',
  })
  status: string;
}
