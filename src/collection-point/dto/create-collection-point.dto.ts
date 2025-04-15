// src/collection-points/dto/create-collection-point.dto.ts
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCollectionPointDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  toadox: number;

  @IsNumber()
  toadoy: number;

  @IsNumber()
  frequency: number;

  @IsNumber()
  srid: number;

  @IsNumber()
  created_by: number;
}
