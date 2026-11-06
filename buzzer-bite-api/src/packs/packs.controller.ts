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
import { CreatePackDto } from "./dto/create-pack.dto";
import { FilterPackDto } from "./dto/filter-pack.dto";
import { UpdatePackDto } from "./dto/update-pack.dto";
import { PacksService } from "./packs.service";

@Controller("packs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONSUMER, UserRole.MERCHANT)
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Post()
  @Roles(UserRole.MERCHANT)
  create(
    @Req() request: { user: AuthActor },
    @Body(requestValidationPipe) createPackDto: CreatePackDto,
  ) {
    return this.packsService.create(createPackDto, request.user);
  }

  @Get()
  findAll() {
    return this.packsService.findAll();
  }

  @Get("search")
  findFiltered(@Query(requestValidationPipe) query: FilterPackDto) {
    return this.packsService.findFiltered(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.packsService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.MERCHANT)
  update(
    @Req() request: { user: AuthActor },
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updatePackDto: UpdatePackDto,
  ) {
    return this.packsService.update(id, updatePackDto, request.user);
  }
}
