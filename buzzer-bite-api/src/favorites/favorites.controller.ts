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
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthActor } from "../auth/auth-actor";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";
import { FavoritesService } from "./favorites.service";

@Controller("favorites")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONSUMER)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  create(
    @Req() request: { user: AuthActor },
    @Body(requestValidationPipe) createFavoriteDto: CreateFavoriteDto,
  ) {
    return this.favoritesService.create(createFavoriteDto, request.user);
  }

  @Get()
  findAll(@Req() request: { user: AuthActor }) {
    return this.favoritesService.findAll(request.user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() request: { user: AuthActor },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.favoritesService.remove(id, request.user);
  }
}
