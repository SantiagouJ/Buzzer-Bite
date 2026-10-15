import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("favorites")
export class FavoriteEntity {
  @PrimaryGeneratedColumn()
  id!: number;
}
