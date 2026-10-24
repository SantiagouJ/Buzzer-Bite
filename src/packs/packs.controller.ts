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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { CreatePackDto } from "./dto/create-pack.dto";
import { FilterPackDto } from "./dto/filter-pack.dto";
import { UpdatePackDto } from "./dto/update-pack.dto";
import { PacksService } from "./packs.service";

@Controller("packs")
@UseGuards(JwtAuthGuard)
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Post()
  create(@Body(requestValidationPipe) createPackDto: CreatePackDto) {
    return this.packsService.create(createPackDto);
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
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updatePackDto: UpdatePackDto,
  ) {
    return this.packsService.update(id, updatePackDto);
  }
}
