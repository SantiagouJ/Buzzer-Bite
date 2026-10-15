import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StoreEntity } from '../../stores/entities/store.entity';
import { OrderEntity } from '../../reservations/entities/order.entity';

export enum UserRole {
  CONSUMER = 'consumer',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column({ name: 'password_hash' })
  password_hash!: string;

  @Column({ name: 'full_name', length: 120 })
  full_name!: string;

  @Column({ length: 30, nullable: true })
  phone!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CONSUMER,
  })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  // Relación con Store: Un comerciante gestiona su tienda
  @OneToOne(() => StoreEntity, (store) => store.user)
  store?: StoreEntity;

  // Relación con Order: Un consumidor puede realizar múltiples pedidos
  @OneToMany(() => OrderEntity, (order) => order.consumer)
  orders!: OrderEntity[];
}