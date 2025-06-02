import { CollectionPoint } from '../entities/collection-point.entity';
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedCollectionPoint {
  @ApiProperty({ type: [CollectionPoint] })
  data: CollectionPoint[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
  totalPages: number;
}
