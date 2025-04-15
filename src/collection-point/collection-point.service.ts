// src/collection-points/collection-point.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { CollectionPoint } from './entities/collection-point.entity';
import { CreateCollectionPointDto } from './dto/create-collection-point.dto';
import { UpdateCollectionPointDto } from './dto/update-collection-point.dto';
import { ReviewPointDto } from './dto/review-point.dto';
import { NotificationsModuleService } from 'src/notifications-module/notifications-module.service';

@Injectable()
export class CollectionPointService {
  constructor(
    @InjectRepository(CollectionPoint)
    private collectionPointRepository: Repository<CollectionPoint>,
    private dataSource: DataSource,
    private notificationsModuleService: NotificationsModuleService,
  ) {}

  findAll(): Promise<CollectionPoint[]> {
    return this.collectionPointRepository.find();
  }

  async findOne(id: number): Promise<CollectionPoint> {
    // Validate id
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid collection point ID');
    }

    const point = await this.collectionPointRepository.findOne({
      where: { id },
    });

    if (!point) {
      throw new NotFoundException(`CollectionPoint #${id} does not exist!`);
    }
    return point;
  }

  async searchName(name: string): Promise<CollectionPoint[]> {
    return this.collectionPointRepository.find({
      where: { name: Like(`%${name}%`) },
    });
  }

  /**
   * Tạo mới điểm thu gom:
   * - Điểm được lưu với trạng thái mặc định là 'pending'
   * - Nếu có toadox và toadoy, chuyển đổi thành WKT lưu vào geom.
   * - Sau khi tạo thành công, tạo thông báo cho admin để kiểm duyệt.
   */
  // src/collection-point/collection-point.service.ts
  async create(data: CreateCollectionPointDto): Promise<CollectionPoint> {
    return await this.dataSource.transaction(async (manager) => {
      let newPoint: CollectionPoint;

      // Chèn điểm mới
      if (data.toadox && data.toadoy) {
        const wkt = `POINT(${data.toadoy} ${data.toadox})`;
        const result: CollectionPoint[] = await manager.query(
          `
        INSERT INTO collection_points (name, type, toadox, toadoy, frequency, srid, geom, created_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326), $8, 'pending')
        RETURNING *;
        `,
          [
            data.name,
            data.type,
            data.toadox,
            data.toadoy,
            data.frequency,
            data.srid,
            wkt,
            data.created_by,
          ],
        );
        newPoint = result[0];
      } else {
        newPoint = this.collectionPointRepository.create({
          ...data,
          status: 'pending',
        });
        newPoint = await manager.save(newPoint);
      }

      // Chèn thông báo trong cùng giao dịch
      await this.notificationsModuleService.createNotification(
        {
          userId: data.created_by,
          collectionPointId: newPoint.id,
          message: `Người dùng đã tạo điểm mới: ${data.name}. Vui lòng kiểm duyệt.`,
        },
        manager, // Truyền manager để dùng cùng giao dịch
      );

      return newPoint;
    });
  }
  async findByStatus(status: string): Promise<CollectionPoint[]> {
    return await this.collectionPointRepository.find({ where: { status } });
  }
  /**
   * Cập nhật điểm thu gom (update và delete chỉ cho admin nên không cần qua kiểm duyệt)
   */
  async update(
    id: number,
    data: UpdateCollectionPointDto,
  ): Promise<CollectionPoint> {
    await this.findOne(id);
    if (data.toadox && data.toadoy) {
      const wkt = `POINT(${data.toadoy} ${data.toadox})`;
      await this.collectionPointRepository.query(
        `
        UPDATE collection_points 
        SET name = $1, type = $2, toadox = $3, toadoy = $4, frequency = $5, srid = $6, geom = ST_GeomFromText($7, 4326)
        WHERE id = $8
        `,
        [
          data.name,
          data.type,
          data.toadox,
          data.toadoy,
          data.frequency,
          data.srid,
          wkt,
          id,
        ],
      );
    } else {
      await this.collectionPointRepository.update(id, data);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.notificationsModuleService.deleteByCollectionPointId(id);
    await this.collectionPointRepository.delete(id);
    return { message: `Điểm thu gom #${id} đã được xóa thành công.` };
  }

  /**
   * Phê duyệt điểm (được gọi khi admin duyệt điểm tạo mới).
   * Khi admin duyệt, status của điểm sẽ được cập nhật (approved hoặc rejected).
   */
  async reviewCollectionPoint(
    id: number,
    reviewPointDto: ReviewPointDto,
  ): Promise<CollectionPoint> {
    const point = await this.findOne(id);
    if (!point) {
      throw new NotFoundException(`CollectionPoint #${id} does not exist!`);
    }

    await this.collectionPointRepository.update(id, {
      status: reviewPointDto.status,
    });

    if (point.created_by) {
      await this.notificationsModuleService.createPointStatusNotification({
        userId: point.created_by,
        collectionPointId: point.id,
        pointName: point.name,
        status: reviewPointDto.status as 'pending' | 'approved' | 'rejected',
      });
    }

    return await this.findOne(id);
  }

  async findByStatusPaginated(status: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    // findAndCount trả về [mảng kết quả, tổng số]
    const [data, total] = await this.collectionPointRepository.findAndCount({
      where: { status },
      relations: ['createdBy'],
      select: {
        createdBy: {
          id: true,
          username: true,
        },
      },
      skip,
      take: limit,
    });

    return {
      data, // Mảng kết quả
      total, // Tổng số bản ghi thỏa mãn
      page, // Trang hiện tại
      limit, // Giới hạn số bản ghi/trang
      totalPages: Math.ceil(total / limit),
    };
  }

  // Nếu không truyền status, bạn có thể dùng hàm này
  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.collectionPointRepository.findAndCount({
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
