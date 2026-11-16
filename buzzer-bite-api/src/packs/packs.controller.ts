import {
  ArgumentsHost,
  Body,
  Catch,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthActor } from "../auth/auth-actor";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PublicImage } from "../common/public-image";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { CreatePackDto } from "./dto/create-pack.dto";
import { FilterPackDto } from "./dto/filter-pack.dto";
import { UpdatePackDto } from "./dto/update-pack.dto";
import { PacksService } from "./packs.service";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Catch()
class PackImageExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const multerCode =
      exception &&
      typeof exception === "object" &&
      (exception as { name?: string }).name === "MulterError"
        ? (exception as { code?: string }).code
        : undefined;

    if (multerCode === "LIMIT_FILE_SIZE") {
      const response = host.switchToHttp().getResponse<{
        status: (code: number) => { json: (body: unknown) => void };
      }>();
      response.status(400).json({
        statusCode: 400,
        message: "La imagen no puede superar 5 MB",
      });
      return;
    }

    super.catch(exception, host);
  }
}

@Controller("packs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONSUMER, UserRole.MERCHANT)
@UseFilters(PackImageExceptionFilter)
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Post()
  @Roles(UserRole.MERCHANT)
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: MAX_IMAGE_BYTES } }))
  create(
    @Req() request: { user: AuthActor },
    @UploadedFile() image: PublicImage | undefined,
    @Body(requestValidationPipe) createPackDto: CreatePackDto,
  ) {
    return this.packsService.create(createPackDto, request.user, image);
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
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: MAX_IMAGE_BYTES } }))
  update(
    @Req() request: { user: AuthActor },
    @UploadedFile() image: PublicImage | undefined,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updatePackDto: UpdatePackDto,
  ) {
    return this.packsService.update(id, updatePackDto, request.user, image);
  }
}
