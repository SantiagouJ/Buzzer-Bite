import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("reservations")
export class ReservationEntity {
  @PrimaryGeneratedColumn()
  id!: number;
}
