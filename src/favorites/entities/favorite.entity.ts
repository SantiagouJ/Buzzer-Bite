import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { StoreEntity } from "../../stores/entities/store.entity";
import { UserEntity } from "../../auth/entities/user.entity";

@Entity("favorites")
@Unique("UQ_favorites_user_store", ["user", "store"])
export class FavoriteEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @ManyToOne(() => StoreEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "store_id" })
  store!: StoreEntity;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;
}
