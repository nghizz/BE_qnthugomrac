import { CollectionPoint } from '../entities/collection-point.entity';

export class PaginatedCollectionPoint {
  data: CollectionPoint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
