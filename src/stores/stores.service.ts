import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsSelect, Repository } from "typeorm";
import { AuthService } from "../auth/auth.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { NearbyStoreDto } from "./dto/nearby-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { StoreEntity } from "./entities/store.entity";
import { StoreRulesService } from "./store-rules/store-rules.service";

const EARTH_RADIUS_KM = 6371;

const STORE_SELECT: FindOptionsSelect<StoreEntity> = {
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  category: true,
  createdAt: true,
  user: { id: true, full_name: true },
};

export type NearbyStore = StoreEntity & { distance_km: number };

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storesRepository: Repository<StoreEntity>,

    private readonly authService: AuthService,

    private readonly storeRulesService: StoreRulesService,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<StoreEntity> {
    const { user_id, ...storeData } = createStoreDto;
    const user = await this.authService.findEntity(user_id);

    const existing = await this.storesRepository.findOneBy({
      user: { id: user_id },
    });

    this.storeRulesService.ensureUserHasNoStore(existing, user_id);

    const store = this.storesRepository.create({ ...storeData, user });
    const saved = await this.storesRepository.save(store);

    return this.findOne(saved.id);
  }

  async findAll(): Promise<StoreEntity[]> {
    return this.storesRepository.find({
      select: STORE_SELECT,
      relations: { user: true },
      order: { createdAt: "ASC" },
    });
  }

  async findOne(id: string): Promise<StoreEntity> {
    const store = await this.storesRepository.findOne({
      where: { id },
      select: STORE_SELECT,
      relations: { user: true },
    });

    if (!store) {
      throw new NotFoundException(`Store with id ${id} was not found`);
    }

    return store;
  }

  async findNearby(query: NearbyStoreDto): Promise<NearbyStore[]> {
    const stores = await this.findAll();

    return stores
      .map((store) => ({
        ...store,
        distance_km: this.distanceInKm(
          query.latitude,
          query.longitude,
          store.latitude,
          store.longitude,
        ),
      }))
      .filter((store) => store.distance_km <= query.radius)
      .sort((a, b) => a.distance_km - b.distance_km);
  }

  async update(
    id: string,
    updateStoreDto: UpdateStoreDto,
  ): Promise<StoreEntity> {
    const store = await this.findOne(id);

    this.storesRepository.merge(store, updateStoreDto);
    await this.storesRepository.save(store);

    return this.findOne(id);
  }

  private distanceInKm(
    fromLatitude: number,
    fromLongitude: number,
    toLatitude: number,
    toLongitude: number,
  ): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const deltaLatitude = toRadians(toLatitude - fromLatitude);
    const deltaLongitude = toRadians(toLongitude - fromLongitude);

    const haversine =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(toRadians(fromLatitude)) *
        Math.cos(toRadians(toLatitude)) *
        Math.sin(deltaLongitude / 2) ** 2;

    const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));

    return Math.round(distance * 100) / 100;
  }
}
