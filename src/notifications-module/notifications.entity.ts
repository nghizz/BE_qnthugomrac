// src/notifications-module/notifications.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth-module/auth.entity';
import { CollectionPoint } from '../collection-point/entities/collection-point.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  status: boolean; // false = chưa đọc, true = đã đọc

  @Column({
    type: 'integer',
  })
  userId: number;

  @Column({
    type: 'integer',
  })
  collectionPointId: number;

  @Column({
    type: 'character varying',
  })
  message: string;

  @Column({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => CollectionPoint)
  @JoinColumn({ name: 'collectionPointId' })
  collectionPoint: CollectionPoint;
}
