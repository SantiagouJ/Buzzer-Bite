import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PackEntity } from "./entities/pack.entity";

@Injectable()
export class PacksService {
  constructor(
    @InjectRepository(PackEntity)
    private readonly packsRepository: Repository<PackEntity>,
  ) {}
}
