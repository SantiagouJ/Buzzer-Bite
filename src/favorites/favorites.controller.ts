import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";
import { FavoritesService } from "./favorites.service";

@Controller("favorites")
@UseGuards(JwtAuthGuard) //Agregarlos a todos los demas modulos
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  create(@Body(requestValidationPipe) createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.create(createFavoriteDto);
  }

  @Get()
  findAll() {
    return this.favoritesService.findAll();
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.favoritesService.remove(id);
  }
}
