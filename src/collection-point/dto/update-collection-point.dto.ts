// src/collection-points/dto/update-collection-point.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateCollectionPointDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  toadox?: number;

  @IsNumber()
  @IsOptional()
  toadoy?: number;

  @IsNumber()
  @IsOptional()
  frequency?: number;

  @IsNumber()
  @IsOptional()
  srid?: number;
}
