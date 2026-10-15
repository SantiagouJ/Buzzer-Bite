import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { PackEntity } from '../../packs/entities/pack.entity';

@Entity('stores')
export class StoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ length: 255 })
  address!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: number;

  @Column({ length: 50 })
  category!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Clave foránea user_id hacia users(id) con restricción UNIQUE (1 a 1)
  @OneToOne(() => UserEntity, (user) => user.store, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  // Relación 1 a N: Una tienda tiene muchos packs de excedentes
  @OneToMany(() => PackEntity, (pack) => pack.store)
  packs!: PackEntity[];
}