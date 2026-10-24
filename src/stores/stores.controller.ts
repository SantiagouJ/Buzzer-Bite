import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { CreateStoreDto } from "./dto/create-store.dto";
import { NearbyStoreDto } from "./dto/nearby-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { StoresService } from "./stores.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("stores")
@UseGuards(JwtAuthGuard) //Agregarlos a todos los demas modulos
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  create(@Body(requestValidationPipe) createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
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
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.update(id, updateStoreDto);
  }
}
