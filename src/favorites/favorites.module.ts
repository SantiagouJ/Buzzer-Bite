import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StoresModule } from "../stores/stores.module";
import { AuthModule } from "../auth/auth.module";
import { FavoriteEntity } from "./entities/favorite.entity";
import { FavoritesController } from "./favorites.controller";
import { FavoriteRulesService } from "./favorite-rules/favorite-rules.service";
import { FavoritesService } from "./favorites.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoriteEntity]),
    AuthModule,
    StoresModule,
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService, FavoriteRulesService],
})
export class FavoritesModule {}
