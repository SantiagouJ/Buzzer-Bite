import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthActor } from "../auth/auth-actor";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { CreateStoreDto } from "./dto/create-store.dto";
import { NearbyStoreDto } from "./dto/nearby-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { StoresService } from "./stores.service";

@Controller("stores")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONSUMER, UserRole.MERCHANT)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles(UserRole.MERCHANT)
  create(
    @Req() request: { user: AuthActor },
    @Body(requestValidationPipe) createStoreDto: CreateStoreDto,
  ) {
    return this.storesService.create(createStoreDto, request.user);
  }

  @Get()
  findAll() {
    return this.storesService.findAll();
  }

  @Get("nearby")
  findNearby(@Query(requestValidationPipe) query: NearbyStoreDto) {
    return this.storesService.findNearby(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.MERCHANT)
  update(
    @Req() request: { user: AuthActor },
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.update(id, updateStoreDto, request.user);
  }
}
