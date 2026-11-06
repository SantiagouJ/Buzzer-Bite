import { ConflictException, Injectable } from "@nestjs/common";
import { FavoriteEntity } from "../entities/favorite.entity";

@Injectable()
export class FavoriteRulesService {
  ensureNotAlreadyFavorite(
    existing: FavoriteEntity | null,
    storeId: string,
    userId: string,
  ): void {
    if (existing) {
      throw new ConflictException(
        `Store with id ${storeId} is already a favorite of user ${userId}`,
      );
    }
  }
}
