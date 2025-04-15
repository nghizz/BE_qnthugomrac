// src/collection-points/entities/collection-point.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth-module/auth.entity';

@Entity('collection_points')
export class CollectionPoint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'double precision', nullable: true })
  toadox: number;

  @Column({ type: 'double precision', nullable: true })
  toadoy: number;

  @Column({ type: 'integer', default: 4326 })
  srid: number;

  // Frequency có thể là số (integer) tùy cấu hình
  @Column({ type: 'integer', nullable: true })
  frequency: number;

  // Lưu geom dưới dạng WKT
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geom: string;

  // Người tạo điểm (ID user)
  @Column()
  created_by: number;
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
