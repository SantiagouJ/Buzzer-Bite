import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderEntity } from "./entities/reservation.entity";

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly reservationsRepository: Repository<OrderEntity>,
  ) {}
}
