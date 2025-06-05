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
    name: 'status',           // DB column: "status"
  })
  status: boolean; // false = chưa đọc, true = đã đọc

  @Column({
    type: 'integer',
    name: 'userid',            // DB column: "userid"
  })
  userId: number;

  @Column({
    type: 'integer',
    name: 'collectionpointid', // DB column: "collectionpointid"
  })
  collectionPointId: number;

  @Column({
    type: 'text',
    name: 'message',           // DB column: "message" (kiểu TEXT)
  })
  message: string;

  @Column({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })           // phải khớp với @Column({ name: 'userid' })
  user: User;

  @ManyToOne(() => CollectionPoint)
  @JoinColumn({ name: 'collectionpointid' }) // phải khớp với @Column({ name: 'collectionpointid' })
  collectionPoint: CollectionPoint;
}
