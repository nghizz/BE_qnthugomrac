// src/collection-points/dto/create-collection-point.dto.ts
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCollectionPointDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'name' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'type' })
  type: string;

  @IsNumber()
  @ApiProperty({ example: 'toadox' })
  toadox: number;

  @IsNumber()
  @ApiProperty({ example: 'toadoy' })
  toadoy: number;

  @IsNumber()
  @ApiProperty({ example: 'frequency' })
  frequency: number;

  @IsNumber()
  @ApiProperty({ example: 'srid' })
  srid: number;

  @IsNumber()
  @ApiProperty({ example: 'created_by' })
  created_by: number;
}
