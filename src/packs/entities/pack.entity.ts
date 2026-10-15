import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("packs")
export class PackEntity {
  @PrimaryGeneratedColumn()
  id!: number;
}
