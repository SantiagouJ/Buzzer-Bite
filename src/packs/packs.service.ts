import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StoresService } from "../stores/stores.service";
import { CreatePackDto } from "./dto/create-pack.dto";
import { FilterPackDto } from "./dto/filter-pack.dto";
import { UpdatePackDto } from "./dto/update-pack.dto";
import { PackEntity } from "./entities/pack.entity";
import { PackRulesService } from "./pack-rules/pack-rules.service";

@Injectable()
export class PacksService {
  constructor(
    @InjectRepository(PackEntity)
    private readonly packsRepository: Repository<PackEntity>,

    private readonly storesService: StoresService,

    private readonly packRulesService: PackRulesService,
  ) {}

  async create(createPackDto: CreatePackDto): Promise<PackEntity> {
    const { store_id, description, ...packData } = createPackDto;
    const store = await this.storesService.findOne(store_id);

    this.packRulesService.ensureDiscountBelowOriginal(
      createPackDto.original_price,
      createPackDto.discount_price,
    );
    this.packRulesService.ensurePickupWindow(
      createPackDto.pickup_start,
      createPackDto.pickup_end,
    );

    const pack = this.packsRepository.create({
      ...packData,
      description: description ?? null,
      store,
    });

    return this.packsRepository.save(pack);
  }

  async findAll(): Promise<PackEntity[]> {
    return this.packsRepository.find({
      relations: { store: true },
      order: { created_at: "ASC" },
    });
  }

  async findOne(id: string): Promise<PackEntity> {
    const pack = await this.packsRepository.findOne({
      where: { id },
      relations: { store: true },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with id ${id} was not found`);
    }

    return pack;
  }

  async findFiltered(query: FilterPackDto): Promise<PackEntity[]> {
    return this.packsRepository.find({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.store_id ? { store: { id: query.store_id } } : {}),
      },
      relations: { store: true },
      order: { created_at: "ASC" },
      take: query.limit,
    });
  }

  async update(id: string, updatePackDto: UpdatePackDto): Promise<PackEntity> {
    const pack = await this.findOne(id);

    if (
      updatePackDto.original_price !== undefined ||
      updatePackDto.discount_price !== undefined
    ) {
      this.packRulesService.ensureDiscountBelowOriginal(
        updatePackDto.original_price ?? pack.original_price,
        updatePackDto.discount_price ?? pack.discount_price,
      );
    }

    if (
      updatePackDto.pickup_start !== undefined ||
      updatePackDto.pickup_end !== undefined
    ) {
      this.packRulesService.ensurePickupWindow(
        updatePackDto.pickup_start ?? pack.pickup_start,
        updatePackDto.pickup_end ?? pack.pickup_end,
      );
    }

    this.packsRepository.merge(pack, updatePackDto);

    return this.packsRepository.save(pack);
  }
}
