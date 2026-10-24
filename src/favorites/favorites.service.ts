import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsSelect, Repository } from "typeorm";
import { StoresService } from "../stores/stores.service";
import { AuthService } from "../auth/auth.service";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";
import { FavoriteEntity } from "./entities/favorite.entity";
import { FavoriteRulesService } from "./favorite-rules/favorite-rules.service";

const FAVORITE_SELECT: FindOptionsSelect<FavoriteEntity> = {
  id: true,
  created_at: true,
  user: { id: true, full_name: true },
  store: {
    id: true,
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    category: true,
  },
};

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoritesRepository: Repository<FavoriteEntity>,

    private readonly authService: AuthService,

    private readonly storesService: StoresService,

    private readonly favoriteRulesService: FavoriteRulesService,
  ) {}

  async create(createFavoriteDto: CreateFavoriteDto): Promise<FavoriteEntity> {
    const { user_id, store_id } = createFavoriteDto;
    const user = await this.authService.findEntity(user_id);
    const store = await this.storesService.findOne(store_id);

    const existing = await this.favoritesRepository.findOneBy({
      user: { id: user_id },
      store: { id: store_id },
    });

    this.favoriteRulesService.ensureNotAlreadyFavorite(
      existing,
      store_id,
      user_id,
    );

    const favorite = this.favoritesRepository.create({ user, store });
    const saved = await this.favoritesRepository.save(favorite);

    return this.findOne(saved.id);
  }

  async findAll(): Promise<FavoriteEntity[]> {
    return this.favoritesRepository.find({
      select: FAVORITE_SELECT,
      relations: { user: true, store: true },
      order: { created_at: "ASC" },
    });
  }

  async findOne(id: string): Promise<FavoriteEntity> {
    const favorite = await this.favoritesRepository.findOne({
      where: { id },
      select: FAVORITE_SELECT,
      relations: { user: true, store: true },
    });

    if (!favorite) {
      throw new NotFoundException(`Favorite with id ${id} was not found`);
    }

    return favorite;
  }

  async remove(id: string): Promise<void> {
    const favorite = await this.findOne(id);

    await this.favoritesRepository.remove(favorite);
  }
}
