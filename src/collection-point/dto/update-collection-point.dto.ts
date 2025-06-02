// src/collection-points/dto/update-collection-point.dto.ts
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCollectionPointDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'name' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'type' })
  type?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 'toadox' })
  toadox?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 'toadoy' })
  toadoy?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 'frequency' })
  frequency?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 'srid' })
  srid?: number;
}
