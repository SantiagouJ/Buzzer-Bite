import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/decimal.transformer';
import { PackEntity } from '../../packs/entities/pack.entity';
import { UserEntity } from '../../auth/entities/user.entity';

export enum OrderStatus {
  RESERVED = 'RESERVED',
  CLAIMED = 'CLAIMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  total_price!: number;

  @Column({ name: 'verification_code', length: 64, unique: true })
  verification_code!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RESERVED,
  })
  status!: OrderStatus;

  @Column({ name: 'claimed_at', type: 'timestamptz', nullable: true })
  claimed_at!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at!: Date;

  // Relación Many-to-One: Muchas órdenes pertenecen a un mismo consumidor
  @ManyToOne(() => UserEntity, (user) => user.orders, { nullable: false })
  @JoinColumn({ name: 'consumer_id' })
  consumer!: UserEntity;

  // Relación Many-to-One: Muchas órdenes pueden reservar un pack específico
  @ManyToOne(() => PackEntity, (pack) => pack.orders, { nullable: false })
  @JoinColumn({ name: 'pack_id' })
  pack!: PackEntity;
}
