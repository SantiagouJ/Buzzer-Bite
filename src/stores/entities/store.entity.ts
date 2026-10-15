import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("stores")
export class StoreEntity {
  @PrimaryGeneratedColumn()
  id!: number;
}
