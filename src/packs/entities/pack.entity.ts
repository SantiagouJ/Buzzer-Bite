import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StoreEntity } from '../../stores/entities/store.entity';
import { OrderEntity } from '../../reservations/entities/order.entity';

export enum PackStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD_OUT = 'SOLD_OUT',
  EXPIRED = 'EXPIRED',
}

@Entity('packs')
export class PackEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 150 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'original_price', type: 'decimal', precision: 10, scale: 2 })
  original_price!: number;

  @Column({ name: 'discount_price', type: 'decimal', precision: 10, scale: 2 })
  discount_price!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ name: 'pickup_start', type: 'time' })
  pickup_start!: string;

  @Column({ name: 'pickup_end', type: 'time' })
  pickup_end!: string;

  @Column({ name: 'pickup_date', type: 'date' })
  pickup_date!: string;

  @Column({
    type: 'enum',
    enum: PackStatus,
    default: PackStatus.AVAILABLE,
  })
  status!: PackStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  // Relación Many-to-One: Muchos packs pertenecen a un comercio
  @ManyToOne(() => StoreEntity, (store) => store.packs, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store!: StoreEntity;

  // Relación One-to-Many: Un pack puede tener varios pedidos/reservas
  @OneToMany(() => OrderEntity, (order) => order.pack)
  orders!: OrderEntity[];
}